package service

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

type FileService struct {
	folderRepo     repository.FolderRepository
	attachmentRepo repository.AttachmentRepository
	storagePath    string
}

func NewFileService(folderRepo repository.FolderRepository, attachmentRepo repository.AttachmentRepository, storagePath string) *FileService {
	return &FileService{
		folderRepo:     folderRepo,
		attachmentRepo: attachmentRepo,
		storagePath:    storagePath,
	}
}

// Folder operations

func (s *FileService) CreateFolder(ctx context.Context, folder *models.Folder) error {
	if folder.Name == "" {
		return errors.New("folder name is required")
	}
	if folder.WorkflowState == "" {
		folder.WorkflowState = "visible"
	}
	return s.folderRepo.Create(ctx, folder)
}

func (s *FileService) GetFolder(ctx context.Context, id uint) (*models.Folder, error) {
	return s.folderRepo.FindByID(ctx, id)
}

func (s *FileService) UpdateFolder(ctx context.Context, folder *models.Folder) error {
	return s.folderRepo.Update(ctx, folder)
}

func (s *FileService) DeleteFolder(ctx context.Context, id uint) error {
	return s.folderRepo.Delete(ctx, id)
}

func (s *FileService) ListFolders(ctx context.Context, contextType string, contextID uint, parentFolderID *uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Folder], error) {
	return s.folderRepo.ListByContext(ctx, contextType, contextID, parentFolderID, params)
}

func (s *FileService) ListSubfolders(ctx context.Context, folderID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Folder], error) {
	folder, err := s.folderRepo.FindByID(ctx, folderID)
	if err != nil {
		return nil, err
	}
	return s.folderRepo.ListByContext(ctx, folder.ContextType, folder.ContextID, &folderID, params)
}

func (s *FileService) GetOrCreateRootFolder(ctx context.Context, contextType string, contextID uint) (*models.Folder, error) {
	folder, err := s.folderRepo.FindRootFolder(ctx, contextType, contextID)
	if err == nil {
		return folder, nil
	}

	name := "course files"
	if contextType == "User" {
		name = "my files"
	}

	root := &models.Folder{
		ContextType:   contextType,
		ContextID:     contextID,
		Name:          name,
		FullName:      name,
		Position:      0,
		WorkflowState: "visible",
	}

	if err := s.folderRepo.Create(ctx, root); err != nil {
		return nil, err
	}

	return root, nil
}

// Attachment operations

func (s *FileService) UploadFile(ctx context.Context, attachment *models.Attachment, fileData io.Reader) error {
	fileUUID := uuid.New().String()
	dir := filepath.Join(s.storagePath, attachment.ContextType, fmt.Sprintf("%d", attachment.ContextID), fileUUID)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("could not create storage directory: %w", err)
	}

	destPath := filepath.Join(dir, attachment.Filename)
	destFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("could not create file: %w", err)
	}
	defer destFile.Close()

	hash := md5.New()
	tee := io.TeeReader(fileData, hash)

	if _, err := io.Copy(destFile, tee); err != nil {
		return fmt.Errorf("could not write file: %w", err)
	}

	attachment.MD5 = hex.EncodeToString(hash.Sum(nil))
	attachment.StoragePath = destPath

	if attachment.WorkflowState == "" {
		attachment.WorkflowState = "active"
	}
	if attachment.FileState == "" {
		attachment.FileState = "available"
	}
	if attachment.UploadStatus == "" {
		attachment.UploadStatus = "success"
	}

	return s.attachmentRepo.Create(ctx, attachment)
}

func (s *FileService) GetAttachment(ctx context.Context, id uint) (*models.Attachment, error) {
	return s.attachmentRepo.FindByID(ctx, id)
}

func (s *FileService) DeleteAttachment(ctx context.Context, id uint) error {
	return s.attachmentRepo.Delete(ctx, id)
}

func (s *FileService) ListFilesByContext(ctx context.Context, contextType string, contextID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Attachment], error) {
	return s.attachmentRepo.ListByContext(ctx, contextType, contextID, params)
}

func (s *FileService) ListFilesByFolder(ctx context.Context, folderID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Attachment], error) {
	return s.attachmentRepo.ListByFolderID(ctx, folderID, params)
}

func (s *FileService) GetFilePath(ctx context.Context, id uint) (string, error) {
	attachment, err := s.attachmentRepo.FindByID(ctx, id)
	if err != nil {
		return "", err
	}
	return attachment.StoragePath, nil
}
