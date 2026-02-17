package service

import (
	"archive/zip"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"path"
	"strings"

	"github.com/kocherm/paper-lms/internal/domain/models"
	"github.com/kocherm/paper-lms/internal/repository"
)

// --- Manifest XML structures ---

// Manifest represents the top-level imsmanifest.xml element.
type Manifest struct {
	XMLName       xml.Name              `xml:"manifest"`
	Identifier    string                `xml:"identifier,attr"`
	Organizations ManifestOrganizations `xml:"organizations"`
	Resources     ManifestResources     `xml:"resources"`
}

// ManifestOrganizations wraps the list of organizations.
type ManifestOrganizations struct {
	Organizations []ManifestOrganization `xml:"organization"`
}

// ManifestOrganization represents a single organization (module structure) in the manifest.
type ManifestOrganization struct {
	Identifier string         `xml:"identifier,attr"`
	Structure  string         `xml:"structure,attr"`
	Items      []ManifestItem `xml:"item"`
}

// ManifestItem represents a single item within an organization. Items can be nested (modules contain items).
type ManifestItem struct {
	Identifier    string         `xml:"identifier,attr"`
	IdentifierRef string         `xml:"identifierref,attr"`
	Title         string         `xml:"title"`
	Items         []ManifestItem `xml:"item"`
}

// ManifestResources wraps the list of resources.
type ManifestResources struct {
	Resources []ManifestResource `xml:"resource"`
}

// ManifestResource represents a single resource entry in the manifest.
type ManifestResource struct {
	Identifier string              `xml:"identifier,attr"`
	Type       string              `xml:"type,attr"`
	Href       string              `xml:"href,attr"`
	Files      []ManifestFile      `xml:"file"`
	Dependencies []ManifestDependency `xml:"dependency"`
}

// ManifestFile represents a file reference within a resource.
type ManifestFile struct {
	Href string `xml:"href,attr"`
}

// ManifestDependency represents a dependency of one resource on another.
type ManifestDependency struct {
	IdentifierRef string `xml:"identifierref,attr"`
}

// --- Canvas-specific XML structures ---

// canvasDiscussionTopic represents a Canvas-exported discussion topic XML.
type canvasDiscussionTopic struct {
	XMLName        xml.Name `xml:"topic"`
	Title          string   `xml:"title"`
	Message        string   `xml:"text"`
	DiscussionType string   `xml:"discussion_type"`
	Pinned         string   `xml:"pinned"`
}

// canvasAssignment represents a Canvas-exported assignment XML.
type canvasAssignment struct {
	XMLName         xml.Name `xml:"assignment"`
	Title           string   `xml:"title"`
	Description     string   `xml:"text"`
	PointsPossible  string   `xml:"points_possible"`
	GradingType     string   `xml:"grading_type"`
	SubmissionTypes string   `xml:"submission_types"`
}

// canvasWebLink represents a web link (imswl) resource.
type canvasWebLink struct {
	XMLName xml.Name `xml:"webLink"`
	Title   string   `xml:"title"`
	URL     struct {
		Href string `xml:"href,attr"`
	} `xml:"url"`
}

// --- Import result ---

// ImportResult summarizes what was imported from an IMSCC package.
type ImportResult struct {
	ModulesCreated     int      `json:"modules_created"`
	PagesCreated       int      `json:"pages_created"`
	AssignmentsCreated int      `json:"assignments_created"`
	QuizzesCreated     int      `json:"quizzes_created"`
	QuestionsCreated   int      `json:"questions_created"`
	DiscussionsCreated int      `json:"discussions_created"`
	ModuleItemsCreated int      `json:"module_items_created"`
	Errors             []string `json:"errors,omitempty"`
	Warnings           []string `json:"warnings,omitempty"`
}

// --- Parser ---

// IMSCCParser parses IMSCC/Common Cartridge zip files and imports content into a course.
type IMSCCParser struct {
	courseRepo          repository.CourseRepository
	moduleRepo          repository.ModuleRepository
	moduleItemRepo      repository.ModuleItemRepository
	pageRepo            repository.PageRepository
	assignmentRepo      repository.AssignmentRepository
	quizRepo            repository.QuizRepository
	quizQuestionRepo    repository.QuizQuestionRepository
	fileService         *FileService
	folderRepo          repository.FolderRepository
	discussionTopicRepo repository.DiscussionTopicRepository
}

// NewIMSCCParser creates a new IMSCC parser with all required dependencies.
func NewIMSCCParser(
	courseRepo repository.CourseRepository,
	moduleRepo repository.ModuleRepository,
	moduleItemRepo repository.ModuleItemRepository,
	pageRepo repository.PageRepository,
	assignmentRepo repository.AssignmentRepository,
	quizRepo repository.QuizRepository,
	quizQuestionRepo repository.QuizQuestionRepository,
	fileService *FileService,
	folderRepo repository.FolderRepository,
	discussionTopicRepo repository.DiscussionTopicRepository,
) *IMSCCParser {
	return &IMSCCParser{
		courseRepo:          courseRepo,
		moduleRepo:         moduleRepo,
		moduleItemRepo:     moduleItemRepo,
		pageRepo:           pageRepo,
		assignmentRepo:     assignmentRepo,
		quizRepo:           quizRepo,
		quizQuestionRepo:   quizQuestionRepo,
		fileService:        fileService,
		folderRepo:         folderRepo,
		discussionTopicRepo: discussionTopicRepo,
	}
}

// ParsePackage is the main entry point. It opens the zip, reads the manifest, and imports all content.
func (p *IMSCCParser) ParsePackage(ctx context.Context, courseID uint, zipPath string) (*ImportResult, error) {
	// Verify the course exists
	_, err := p.courseRepo.FindByID(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("course %d not found: %w", courseID, err)
	}

	// Open zip file
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open zip file: %w", err)
	}
	defer reader.Close()

	// Build a lookup map of zip file entries by name
	zipFiles := make(map[string]*zip.File)
	for _, f := range reader.File {
		zipFiles[f.Name] = f
	}

	// Read and parse imsmanifest.xml
	manifestFile, ok := zipFiles["imsmanifest.xml"]
	if !ok {
		return nil, fmt.Errorf("imsmanifest.xml not found in package")
	}

	manifest, err := parseManifest(manifestFile)
	if err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
	}

	// Build resource lookup by identifier
	resourceMap := make(map[string]ManifestResource)
	for _, res := range manifest.Resources.Resources {
		resourceMap[res.Identifier] = res
	}

	result := &ImportResult{}

	// Process organizations (modules)
	for _, org := range manifest.Organizations.Organizations {
		p.processOrganization(ctx, courseID, org, resourceMap, zipFiles, result)
	}

	// Process any resources not referenced by organizations (orphan resources)
	referencedResources := collectReferencedResources(manifest)
	for _, res := range manifest.Resources.Resources {
		if _, referenced := referencedResources[res.Identifier]; referenced {
			continue
		}
		// Import orphan resources without a module context
		p.importResource(ctx, courseID, res, zipFiles, nil, 0, result)
	}

	return result, nil
}

func parseManifest(f *zip.File) (*Manifest, error) {
	rc, err := f.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, err
	}

	var manifest Manifest
	if err := xml.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("XML unmarshal error: %w", err)
	}

	return &manifest, nil
}

// collectReferencedResources returns a set of resource identifiers that are referenced by organization items.
func collectReferencedResources(manifest *Manifest) map[string]bool {
	refs := make(map[string]bool)
	for _, org := range manifest.Organizations.Organizations {
		collectItemRefs(org.Items, refs)
	}
	return refs
}

func collectItemRefs(items []ManifestItem, refs map[string]bool) {
	for _, item := range items {
		if item.IdentifierRef != "" {
			refs[item.IdentifierRef] = true
		}
		collectItemRefs(item.Items, refs)
	}
}

func (p *IMSCCParser) processOrganization(
	ctx context.Context,
	courseID uint,
	org ManifestOrganization,
	resourceMap map[string]ManifestResource,
	zipFiles map[string]*zip.File,
	result *ImportResult,
) {
	// Each top-level item in an organization is a module.
	// Sub-items are module items.
	for modulePos, topItem := range org.Items {
		moduleName := topItem.Title
		if moduleName == "" {
			moduleName = fmt.Sprintf("Module %d", modulePos+1)
		}

		module := &models.ContextModule{
			CourseID:      courseID,
			Name:          moduleName,
			Position:      modulePos + 1,
			WorkflowState: "active",
		}

		if err := p.moduleRepo.Create(ctx, module); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to create module %q: %v", moduleName, err))
			continue
		}
		result.ModulesCreated++

		// If the top-level item itself references a resource (no sub-items), treat it as both module and item
		if topItem.IdentifierRef != "" && len(topItem.Items) == 0 {
			res, ok := resourceMap[topItem.IdentifierRef]
			if ok {
				p.importResource(ctx, courseID, res, zipFiles, module, 1, result)
			}
			continue
		}

		// Process sub-items as module items
		for itemPos, subItem := range topItem.Items {
			if subItem.IdentifierRef == "" {
				// Sub-header (no resource reference)
				tag := &models.ContentTag{
					ContextModuleID: module.ID,
					ContentType:     "ContextModuleSubHeader",
					Title:           subItem.Title,
					Position:        itemPos + 1,
					WorkflowState:   "active",
				}
				if err := p.moduleItemRepo.Create(ctx, tag); err != nil {
					result.Errors = append(result.Errors, fmt.Sprintf("failed to create sub-header %q: %v", subItem.Title, err))
				} else {
					result.ModuleItemsCreated++
				}
				continue
			}

			res, ok := resourceMap[subItem.IdentifierRef]
			if !ok {
				result.Warnings = append(result.Warnings, fmt.Sprintf("resource %q referenced by item %q not found", subItem.IdentifierRef, subItem.Title))
				continue
			}

			p.importResource(ctx, courseID, res, zipFiles, module, itemPos+1, result)
		}
	}
}

// importResource imports a single manifest resource and optionally creates a module item for it.
func (p *IMSCCParser) importResource(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	resType := normalizeResourceType(res.Type)

	switch resType {
	case "webcontent":
		p.importWebContent(ctx, courseID, res, zipFiles, module, position, result)
	case "discussion":
		p.importDiscussion(ctx, courseID, res, zipFiles, module, position, result)
	case "assignment":
		p.importAssignment(ctx, courseID, res, zipFiles, module, position, result)
	case "quiz":
		p.importQuiz(ctx, courseID, res, zipFiles, module, position, result)
	case "weblink":
		p.importWebLink(ctx, courseID, res, zipFiles, module, position, result)
	case "learning_application":
		p.importAssignment(ctx, courseID, res, zipFiles, module, position, result)
	default:
		result.Warnings = append(result.Warnings, fmt.Sprintf("unsupported resource type %q for resource %q", res.Type, res.Identifier))
	}
}

// normalizeResourceType maps IMSCC resource type strings to simplified categories.
func normalizeResourceType(t string) string {
	t = strings.ToLower(t)

	switch {
	case strings.Contains(t, "imsdt_xmlv1p") || strings.Contains(t, "imsdt_v1p"):
		return "discussion"
	case strings.Contains(t, "imsqti_xmlv") || strings.Contains(t, "imsqti_item_xmlv"):
		return "quiz"
	case t == "webcontent" || strings.Contains(t, "webcontent"):
		return "webcontent"
	case strings.Contains(t, "assignment_xmlv1p") || strings.Contains(t, "canvas_assignment"):
		return "assignment"
	case strings.Contains(t, "imswl_xmlv1p"):
		return "weblink"
	case strings.Contains(t, "learning-application-resource"):
		return "learning_application"
	default:
		return t
	}
}

// --- Resource importers ---

func (p *IMSCCParser) importWebContent(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	// Read the HTML file from the zip
	href := res.Href
	if href == "" && len(res.Files) > 0 {
		href = res.Files[0].Href
	}
	if href == "" {
		result.Warnings = append(result.Warnings, fmt.Sprintf("webcontent resource %q has no file reference", res.Identifier))
		return
	}

	body, err := readZipFile(zipFiles, href)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to read webcontent file %q: %v", href, err))
		return
	}

	// Derive title from filename
	title := titleFromHref(href)

	// Create wiki page
	pageURL := slugify(title)
	page := &models.WikiPage{
		CourseID:      courseID,
		Title:         title,
		URL:           pageURL,
		Body:          string(body),
		WorkflowState: "active",
	}

	if err := p.pageRepo.Create(ctx, page); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create page %q: %v", title, err))
		return
	}
	result.PagesCreated++

	// Create module item if in a module
	if module != nil {
		p.createModuleItem(ctx, module.ID, "WikiPage", &page.ID, title, position, result)
	}
}

func (p *IMSCCParser) importDiscussion(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	href := res.Href
	if href == "" && len(res.Files) > 0 {
		href = res.Files[0].Href
	}

	title := titleFromHref(href)
	message := ""

	if href != "" {
		data, err := readZipFile(zipFiles, href)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("could not read discussion file %q: %v", href, err))
		} else {
			var topic canvasDiscussionTopic
			if xmlErr := xml.Unmarshal(data, &topic); xmlErr == nil {
				if topic.Title != "" {
					title = topic.Title
				}
				message = topic.Message
			} else {
				// Treat as plain HTML content
				message = string(data)
			}
		}
	}

	if title == "" {
		title = res.Identifier
	}

	disc := &models.DiscussionTopic{
		CourseID:       courseID,
		UserID:         0, // Will be set by caller or default
		Title:          title,
		Message:        message,
		DiscussionType: "side_comment",
		WorkflowState:  "active",
	}

	if err := p.discussionTopicRepo.Create(ctx, disc); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create discussion %q: %v", title, err))
		return
	}
	result.DiscussionsCreated++

	if module != nil {
		p.createModuleItem(ctx, module.ID, "DiscussionTopic", &disc.ID, title, position, result)
	}
}

func (p *IMSCCParser) importAssignment(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	href := res.Href
	if href == "" && len(res.Files) > 0 {
		href = res.Files[0].Href
	}

	title := titleFromHref(href)
	description := ""
	gradingType := "points"
	submissionTypes := "online_text_entry"
	var pointsPossible *float64

	if href != "" {
		data, err := readZipFile(zipFiles, href)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("could not read assignment file %q: %v", href, err))
		} else {
			var ca canvasAssignment
			if xmlErr := xml.Unmarshal(data, &ca); xmlErr == nil {
				if ca.Title != "" {
					title = ca.Title
				}
				description = ca.Description
				if ca.GradingType != "" {
					gradingType = ca.GradingType
				}
				if ca.SubmissionTypes != "" {
					submissionTypes = ca.SubmissionTypes
				}
				if ca.PointsPossible != "" {
					if pts, parseErr := parseFloatStr(ca.PointsPossible); parseErr == nil {
						pointsPossible = &pts
					}
				}
			} else {
				// Treat as HTML description
				description = string(data)
			}
		}
	}

	if title == "" {
		title = res.Identifier
	}

	assignment := &models.Assignment{
		CourseID:        courseID,
		Name:            title,
		Description:     description,
		PointsPossible:  pointsPossible,
		GradingType:     gradingType,
		SubmissionTypes:  submissionTypes,
		WorkflowState:   "unpublished",
	}

	if err := p.assignmentRepo.Create(ctx, assignment); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create assignment %q: %v", title, err))
		return
	}
	result.AssignmentsCreated++

	if module != nil {
		p.createModuleItem(ctx, module.ID, "Assignment", &assignment.ID, title, position, result)
	}
}

func (p *IMSCCParser) importQuiz(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	href := res.Href
	if href == "" && len(res.Files) > 0 {
		href = res.Files[0].Href
	}
	if href == "" {
		result.Warnings = append(result.Warnings, fmt.Sprintf("quiz resource %q has no file reference", res.Identifier))
		return
	}

	data, err := readZipFile(zipFiles, href)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to read quiz file %q: %v", href, err))
		return
	}

	qtiResult, err := ParseQTIAssessment(data)
	if err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to parse QTI for resource %q: %v", res.Identifier, err))
		return
	}

	title := qtiResult.Title
	if title == "" {
		title = titleFromHref(href)
	}
	if title == "" {
		title = res.Identifier
	}

	pointsPossible := qtiResult.PointsPossible

	quiz := &models.Quiz{
		CourseID:        courseID,
		Title:           title,
		Description:     qtiResult.Description,
		QuizType:        qtiResult.QuizType,
		TimeLimit:       qtiResult.TimeLimit,
		AllowedAttempts: 1,
		PointsPossible:  &pointsPossible,
		WorkflowState:   "unpublished",
	}

	if err := p.quizRepo.Create(ctx, quiz); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create quiz %q: %v", title, err))
		return
	}
	result.QuizzesCreated++

	// Create quiz questions
	for i := range qtiResult.Questions {
		q := &qtiResult.Questions[i]
		q.QuizID = quiz.ID
		if err := p.quizQuestionRepo.Create(ctx, q); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to create question %d for quiz %q: %v", q.Position, title, err))
		} else {
			result.QuestionsCreated++
		}
	}

	if module != nil {
		p.createModuleItem(ctx, module.ID, "Quiz", &quiz.ID, title, position, result)
	}
}

func (p *IMSCCParser) importWebLink(
	ctx context.Context,
	courseID uint,
	res ManifestResource,
	zipFiles map[string]*zip.File,
	module *models.ContextModule,
	position int,
	result *ImportResult,
) {
	href := res.Href
	if href == "" && len(res.Files) > 0 {
		href = res.Files[0].Href
	}

	title := titleFromHref(href)
	linkURL := ""

	if href != "" {
		data, err := readZipFile(zipFiles, href)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("could not read weblink file %q: %v", href, err))
		} else {
			var wl canvasWebLink
			if xmlErr := xml.Unmarshal(data, &wl); xmlErr == nil {
				if wl.Title != "" {
					title = wl.Title
				}
				linkURL = wl.URL.Href
			}
		}
	}

	if title == "" {
		title = res.Identifier
	}

	// Create a wiki page with the link content
	body := ""
	if linkURL != "" {
		body = fmt.Sprintf(`<p><a href="%s" target="_blank">%s</a></p>`, linkURL, title)
	}

	pageURL := slugify(title)
	page := &models.WikiPage{
		CourseID:      courseID,
		Title:         title,
		URL:           pageURL,
		Body:          body,
		WorkflowState: "active",
	}

	if err := p.pageRepo.Create(ctx, page); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create page for web link %q: %v", title, err))
		return
	}
	result.PagesCreated++

	if module != nil {
		p.createModuleItem(ctx, module.ID, "WikiPage", &page.ID, title, position, result)
	}
}

// --- Helpers ---

func (p *IMSCCParser) createModuleItem(
	ctx context.Context,
	moduleID uint,
	contentType string,
	contentID *uint,
	title string,
	position int,
	result *ImportResult,
) {
	tag := &models.ContentTag{
		ContextModuleID: moduleID,
		ContentType:     contentType,
		ContentID:       contentID,
		Title:           title,
		Position:        position,
		WorkflowState:   "active",
	}

	if err := p.moduleItemRepo.Create(ctx, tag); err != nil {
		result.Errors = append(result.Errors, fmt.Sprintf("failed to create module item %q: %v", title, err))
		return
	}
	result.ModuleItemsCreated++
}

// readZipFile reads the contents of a file inside the zip by its path.
func readZipFile(zipFiles map[string]*zip.File, filePath string) ([]byte, error) {
	f, ok := zipFiles[filePath]
	if !ok {
		// Try with/without leading slash
		alt := strings.TrimPrefix(filePath, "/")
		f, ok = zipFiles[alt]
		if !ok {
			return nil, fmt.Errorf("file %q not found in zip", filePath)
		}
	}

	rc, err := f.Open()
	if err != nil {
		return nil, fmt.Errorf("could not open %q: %w", filePath, err)
	}
	defer rc.Close()

	return io.ReadAll(rc)
}

// titleFromHref extracts a human-readable title from a file path.
func titleFromHref(href string) string {
	if href == "" {
		return ""
	}
	base := path.Base(href)
	// Remove extension
	ext := path.Ext(base)
	if ext != "" {
		base = strings.TrimSuffix(base, ext)
	}
	// Replace underscores and hyphens with spaces
	base = strings.ReplaceAll(base, "_", " ")
	base = strings.ReplaceAll(base, "-", " ")
	return strings.TrimSpace(base)
}

// parseFloatStr is a helper to parse a float string, returning an error on failure.
func parseFloatStr(s string) (float64, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, fmt.Errorf("empty string")
	}
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}
