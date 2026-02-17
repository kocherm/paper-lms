package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/kocherm/paper-lms/internal/api/v1/middleware"
	"github.com/kocherm/paper-lms/internal/api/v1/responses"
	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/service"
)

type FileHandler struct {
	fileService *service.FileService
}

func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{fileService: fileService}
}

func attachmentToJSON(a *models.Attachment) fiber.Map {
	return fiber.Map{
		"id":             a.ID,
		"context_type":   a.ContextType,
		"context_id":     a.ContextID,
		"folder_id":      a.FolderID,
		"user_id":        a.UserID,
		"display_name":   a.DisplayName,
		"filename":       a.Filename,
		"content_type":   a.ContentType,
		"size":           a.Size,
		"md5":            a.MD5,
		"workflow_state": a.WorkflowState,
		"file_state":     a.FileState,
		"upload_status":  a.UploadStatus,
		"created_at":     a.CreatedAt,
		"updated_at":     a.UpdatedAt,
		"url":            fmt.Sprintf("/api/v1/files/%d/download", a.ID),
	}
}

func (h *FileHandler) ListCourseFiles(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.fileService.ListFilesByContext(c.Context(), "Course", uint(courseID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch files")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	files := make([]fiber.Map, len(result.Items))
	for i, a := range result.Items {
		files[i] = attachmentToJSON(&a)
	}

	return c.JSON(files)
}

func (h *FileHandler) UploadCourseFile(c *fiber.Ctx) error {
	courseID, err := c.ParamsInt("course_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid course ID")
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return responses.BadRequest(c, "File is required")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return responses.InternalError(c, "Could not open uploaded file")
	}
	defer file.Close()

	attachment := &models.Attachment{
		ContextType: "Course",
		ContextID:   uint(courseID),
		UserID:      c.Locals("user_id").(uint),
		DisplayName: fileHeader.Filename,
		Filename:    fileHeader.Filename,
		ContentType: fileHeader.Header.Get("Content-Type"),
		Size:        fileHeader.Size,
	}

	if err := h.fileService.UploadFile(c.Context(), attachment, file); err != nil {
		return responses.InternalError(c, "Could not upload file")
	}

	return c.Status(fiber.StatusCreated).JSON(attachmentToJSON(attachment))
}

func (h *FileHandler) GetFile(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid file ID")
	}

	attachment, err := h.fileService.GetAttachment(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "file")
	}

	return c.JSON(attachmentToJSON(attachment))
}

func (h *FileHandler) DeleteFile(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid file ID")
	}

	if err := h.fileService.DeleteAttachment(c.Context(), uint(id)); err != nil {
		return responses.InternalError(c, "Could not delete file")
	}

	return c.JSON(fiber.Map{"delete": true})
}

func (h *FileHandler) DownloadFile(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return responses.BadRequest(c, "Invalid file ID")
	}

	attachment, err := h.fileService.GetAttachment(c.Context(), uint(id))
	if err != nil {
		return responses.NotFound(c, "file")
	}

	filePath, err := h.fileService.GetFilePath(c.Context(), uint(id))
	if err != nil {
		return responses.InternalError(c, "Could not locate file")
	}

	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", attachment.Filename))
	return c.SendFile(filePath)
}

func (h *FileHandler) ListFolderFiles(c *fiber.Ctx) error {
	folderID, err := c.ParamsInt("folder_id")
	if err != nil {
		return responses.BadRequest(c, "Invalid folder ID")
	}

	params := middleware.GetPagination(c)

	result, err := h.fileService.ListFilesByFolder(c.Context(), uint(folderID), params)
	if err != nil {
		return responses.InternalError(c, "Could not fetch files")
	}

	responses.SetPaginationHeaders(c, result.TotalCount, result.Page, result.PerPage)

	files := make([]fiber.Map, len(result.Items))
	for i, a := range result.Items {
		files[i] = attachmentToJSON(&a)
	}

	return c.JSON(files)
}
