package mocks

import (
	"context"
	"time"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository mocks repository.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) FindByID(ctx context.Context, id uint) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) FindByLoginID(ctx context.Context, loginID string) (*models.User, error) {
	args := m.Called(ctx, loginID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) FindBySISUserID(ctx context.Context, sisUserID string) (*models.User, error) {
	args := m.Called(ctx, sisUserID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) List(ctx context.Context, params repository.PaginationParams) (*repository.PaginatedResult[models.User], error) {
	args := m.Called(ctx, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.User]), args.Error(1)
}

// MockCourseRepository mocks repository.CourseRepository
type MockCourseRepository struct {
	mock.Mock
}

func (m *MockCourseRepository) Create(ctx context.Context, course *models.Course) error {
	args := m.Called(ctx, course)
	return args.Error(0)
}

func (m *MockCourseRepository) FindByID(ctx context.Context, id uint) (*models.Course, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Course), args.Error(1)
}

func (m *MockCourseRepository) FindBySISCourseID(ctx context.Context, sisCourseID string) (*models.Course, error) {
	args := m.Called(ctx, sisCourseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Course), args.Error(1)
}

func (m *MockCourseRepository) Update(ctx context.Context, course *models.Course) error {
	args := m.Called(ctx, course)
	return args.Error(0)
}

func (m *MockCourseRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockCourseRepository) List(ctx context.Context, params repository.PaginationParams) (*repository.PaginatedResult[models.Course], error) {
	args := m.Called(ctx, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Course]), args.Error(1)
}

func (m *MockCourseRepository) ListByUserID(ctx context.Context, userID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Course], error) {
	args := m.Called(ctx, userID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Course]), args.Error(1)
}

// MockEnrollmentRepository mocks repository.EnrollmentRepository
type MockEnrollmentRepository struct {
	mock.Mock
}

func (m *MockEnrollmentRepository) Create(ctx context.Context, enrollment *models.Enrollment) error {
	args := m.Called(ctx, enrollment)
	return args.Error(0)
}

func (m *MockEnrollmentRepository) FindByID(ctx context.Context, id uint) (*models.Enrollment, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Enrollment), args.Error(1)
}

func (m *MockEnrollmentRepository) Update(ctx context.Context, enrollment *models.Enrollment) error {
	args := m.Called(ctx, enrollment)
	return args.Error(0)
}

func (m *MockEnrollmentRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Enrollment], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Enrollment]), args.Error(1)
}

func (m *MockEnrollmentRepository) ListByUserID(ctx context.Context, userID uint) ([]models.Enrollment, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Enrollment), args.Error(1)
}

func (m *MockEnrollmentRepository) FindByUserAndCourse(ctx context.Context, userID, courseID uint) (*models.Enrollment, error) {
	args := m.Called(ctx, userID, courseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Enrollment), args.Error(1)
}

// MockSectionRepository mocks repository.SectionRepository
type MockSectionRepository struct {
	mock.Mock
}

func (m *MockSectionRepository) Create(ctx context.Context, section *models.CourseSection) error {
	args := m.Called(ctx, section)
	return args.Error(0)
}

func (m *MockSectionRepository) FindByID(ctx context.Context, id uint) (*models.CourseSection, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CourseSection), args.Error(1)
}

func (m *MockSectionRepository) FindBySISSectionID(ctx context.Context, sisSectionID string) (*models.CourseSection, error) {
	args := m.Called(ctx, sisSectionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CourseSection), args.Error(1)
}

func (m *MockSectionRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.CourseSection], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.CourseSection]), args.Error(1)
}

// MockAssignmentRepository mocks repository.AssignmentRepository
type MockAssignmentRepository struct {
	mock.Mock
}

func (m *MockAssignmentRepository) Create(ctx context.Context, assignment *models.Assignment) error {
	args := m.Called(ctx, assignment)
	return args.Error(0)
}

func (m *MockAssignmentRepository) FindByID(ctx context.Context, id uint) (*models.Assignment, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Assignment), args.Error(1)
}

func (m *MockAssignmentRepository) Update(ctx context.Context, assignment *models.Assignment) error {
	args := m.Called(ctx, assignment)
	return args.Error(0)
}

func (m *MockAssignmentRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockAssignmentRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Assignment], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Assignment]), args.Error(1)
}

// MockSubmissionRepository mocks repository.SubmissionRepository
type MockSubmissionRepository struct {
	mock.Mock
}

func (m *MockSubmissionRepository) Create(ctx context.Context, submission *models.Submission) error {
	args := m.Called(ctx, submission)
	return args.Error(0)
}

func (m *MockSubmissionRepository) FindByID(ctx context.Context, id uint) (*models.Submission, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Submission), args.Error(1)
}

func (m *MockSubmissionRepository) FindByAssignmentAndUser(ctx context.Context, assignmentID, userID uint) (*models.Submission, error) {
	args := m.Called(ctx, assignmentID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Submission), args.Error(1)
}

func (m *MockSubmissionRepository) Update(ctx context.Context, submission *models.Submission) error {
	args := m.Called(ctx, submission)
	return args.Error(0)
}

func (m *MockSubmissionRepository) ListByAssignmentID(ctx context.Context, assignmentID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Submission], error) {
	args := m.Called(ctx, assignmentID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Submission]), args.Error(1)
}

func (m *MockSubmissionRepository) ListByUserAndCourse(ctx context.Context, userID, courseID uint) ([]models.Submission, error) {
	args := m.Called(ctx, userID, courseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Submission), args.Error(1)
}

func (m *MockSubmissionRepository) BulkListByCourse(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.Submission], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.Submission]), args.Error(1)
}

// MockAssignmentGroupRepository mocks repository.AssignmentGroupRepository
type MockAssignmentGroupRepository struct {
	mock.Mock
}

func (m *MockAssignmentGroupRepository) Create(ctx context.Context, group *models.AssignmentGroup) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

func (m *MockAssignmentGroupRepository) FindByID(ctx context.Context, id uint) (*models.AssignmentGroup, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AssignmentGroup), args.Error(1)
}

func (m *MockAssignmentGroupRepository) Update(ctx context.Context, group *models.AssignmentGroup) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

func (m *MockAssignmentGroupRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockAssignmentGroupRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.AssignmentGroup], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.AssignmentGroup]), args.Error(1)
}

// MockAccessTokenRepository mocks repository.AccessTokenRepository
type MockAccessTokenRepository struct {
	mock.Mock
}

func (m *MockAccessTokenRepository) Create(ctx context.Context, token *models.AccessToken) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *MockAccessTokenRepository) FindByID(ctx context.Context, id uint) (*models.AccessToken, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AccessToken), args.Error(1)
}

func (m *MockAccessTokenRepository) FindByToken(ctx context.Context, tokenHash string) (*models.AccessToken, error) {
	args := m.Called(ctx, tokenHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AccessToken), args.Error(1)
}

func (m *MockAccessTokenRepository) FindByRefreshToken(ctx context.Context, refreshToken string) (*models.AccessToken, error) {
	args := m.Called(ctx, refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AccessToken), args.Error(1)
}

func (m *MockAccessTokenRepository) Update(ctx context.Context, token *models.AccessToken) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *MockAccessTokenRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockAccessTokenRepository) ListByUserID(ctx context.Context, userID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.AccessToken], error) {
	args := m.Called(ctx, userID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.AccessToken]), args.Error(1)
}

func (m *MockAccessTokenRepository) DeleteExpired(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// MockModuleRepository mocks repository.ModuleRepository
type MockModuleRepository struct {
	mock.Mock
}

func (m *MockModuleRepository) Create(ctx context.Context, module *models.ContextModule) error {
	args := m.Called(ctx, module)
	return args.Error(0)
}

func (m *MockModuleRepository) FindByID(ctx context.Context, id uint) (*models.ContextModule, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ContextModule), args.Error(1)
}

func (m *MockModuleRepository) Update(ctx context.Context, module *models.ContextModule) error {
	args := m.Called(ctx, module)
	return args.Error(0)
}

func (m *MockModuleRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockModuleRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.ContextModule], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.ContextModule]), args.Error(1)
}

func (m *MockModuleRepository) FindActiveByDateRange(ctx context.Context, courseID uint, date time.Time) (*models.ContextModule, error) {
	args := m.Called(ctx, courseID, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ContextModule), args.Error(1)
}

// MockModuleItemRepository mocks repository.ModuleItemRepository
type MockModuleItemRepository struct {
	mock.Mock
}

func (m *MockModuleItemRepository) Create(ctx context.Context, item *models.ContentTag) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockModuleItemRepository) FindByID(ctx context.Context, id uint) (*models.ContentTag, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ContentTag), args.Error(1)
}

func (m *MockModuleItemRepository) ListByModuleID(ctx context.Context, moduleID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.ContentTag], error) {
	args := m.Called(ctx, moduleID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.ContentTag]), args.Error(1)
}

// MockPageRepository mocks repository.PageRepository
type MockPageRepository struct {
	mock.Mock
}

func (m *MockPageRepository) Create(ctx context.Context, page *models.WikiPage) error {
	args := m.Called(ctx, page)
	return args.Error(0)
}

func (m *MockPageRepository) FindByID(ctx context.Context, id uint) (*models.WikiPage, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.WikiPage), args.Error(1)
}

func (m *MockPageRepository) FindByCourseAndURL(ctx context.Context, courseID uint, url string) (*models.WikiPage, error) {
	args := m.Called(ctx, courseID, url)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.WikiPage), args.Error(1)
}

func (m *MockPageRepository) Update(ctx context.Context, page *models.WikiPage) error {
	args := m.Called(ctx, page)
	return args.Error(0)
}

func (m *MockPageRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPageRepository) ListByCourseID(ctx context.Context, courseID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.WikiPage], error) {
	args := m.Called(ctx, courseID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.WikiPage]), args.Error(1)
}

func (m *MockPageRepository) FindPublicByCourseAndURL(ctx context.Context, courseID uint, url string) (*models.WikiPage, error) {
	args := m.Called(ctx, courseID, url)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.WikiPage), args.Error(1)
}

// MockQuizQuestionRepository mocks repository.QuizQuestionRepository
type MockQuizQuestionRepository struct {
	mock.Mock
}

func (m *MockQuizQuestionRepository) Create(ctx context.Context, question *models.QuizQuestion) error {
	args := m.Called(ctx, question)
	return args.Error(0)
}

func (m *MockQuizQuestionRepository) FindByID(ctx context.Context, id uint) (*models.QuizQuestion, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.QuizQuestion), args.Error(1)
}

func (m *MockQuizQuestionRepository) Update(ctx context.Context, question *models.QuizQuestion) error {
	args := m.Called(ctx, question)
	return args.Error(0)
}

func (m *MockQuizQuestionRepository) Delete(ctx context.Context, id uint) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQuizQuestionRepository) ListByQuizID(ctx context.Context, quizID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.QuizQuestion], error) {
	args := m.Called(ctx, quizID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.QuizQuestion]), args.Error(1)
}

// MockQuizSubmissionRepository mocks repository.QuizSubmissionRepository
type MockQuizSubmissionRepository struct {
	mock.Mock
}

func (m *MockQuizSubmissionRepository) Create(ctx context.Context, submission *models.QuizSubmission) error {
	args := m.Called(ctx, submission)
	return args.Error(0)
}

func (m *MockQuizSubmissionRepository) FindByID(ctx context.Context, id uint) (*models.QuizSubmission, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.QuizSubmission), args.Error(1)
}

func (m *MockQuizSubmissionRepository) Update(ctx context.Context, submission *models.QuizSubmission) error {
	args := m.Called(ctx, submission)
	return args.Error(0)
}

func (m *MockQuizSubmissionRepository) FindByQuizAndUser(ctx context.Context, quizID, userID uint) (*models.QuizSubmission, error) {
	args := m.Called(ctx, quizID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.QuizSubmission), args.Error(1)
}

func (m *MockQuizSubmissionRepository) ListByQuizID(ctx context.Context, quizID uint, params repository.PaginationParams) (*repository.PaginatedResult[models.QuizSubmission], error) {
	args := m.Called(ctx, quizID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PaginatedResult[models.QuizSubmission]), args.Error(1)
}

// MockQuizSubmissionAnswerRepository mocks repository.QuizSubmissionAnswerRepository
type MockQuizSubmissionAnswerRepository struct {
	mock.Mock
}

func (m *MockQuizSubmissionAnswerRepository) Create(ctx context.Context, answer *models.QuizSubmissionAnswer) error {
	args := m.Called(ctx, answer)
	return args.Error(0)
}

func (m *MockQuizSubmissionAnswerRepository) BulkCreate(ctx context.Context, answers []models.QuizSubmissionAnswer) error {
	args := m.Called(ctx, answers)
	return args.Error(0)
}

func (m *MockQuizSubmissionAnswerRepository) FindByID(ctx context.Context, id uint) (*models.QuizSubmissionAnswer, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.QuizSubmissionAnswer), args.Error(1)
}

func (m *MockQuizSubmissionAnswerRepository) Update(ctx context.Context, answer *models.QuizSubmissionAnswer) error {
	args := m.Called(ctx, answer)
	return args.Error(0)
}

func (m *MockQuizSubmissionAnswerRepository) ListBySubmissionID(ctx context.Context, submissionID uint) ([]models.QuizSubmissionAnswer, error) {
	args := m.Called(ctx, submissionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.QuizSubmissionAnswer), args.Error(1)
}

func (m *MockQuizSubmissionAnswerRepository) FindBySubmissionAndQuestion(ctx context.Context, submissionID, questionID uint) (*models.QuizSubmissionAnswer, error) {
	args := m.Called(ctx, submissionID, questionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.QuizSubmissionAnswer), args.Error(1)
}

// MockSubmissionCommentRepository mocks repository.SubmissionCommentRepository
type MockSubmissionCommentRepository struct {
	mock.Mock
}

func (m *MockSubmissionCommentRepository) Create(ctx context.Context, comment *models.SubmissionComment) error {
	args := m.Called(ctx, comment)
	return args.Error(0)
}

func (m *MockSubmissionCommentRepository) ListBySubmissionID(ctx context.Context, submissionID uint) ([]models.SubmissionComment, error) {
	args := m.Called(ctx, submissionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SubmissionComment), args.Error(1)
}
