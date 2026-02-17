package service

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"html"
	"strconv"
	"strings"

	"github.com/kocherm/paper-lms/internal/domain/models"
)

// QTIResult contains the parsed quiz metadata and questions from a QTI XML assessment.
type QTIResult struct {
	Title          string
	Description    string
	QuizType       string
	TimeLimit      *int
	PointsPossible float64
	Questions      []models.QuizQuestion
}

// --- QTI 1.2 XML structures (Canvas primary format) ---

type qtiQuestestinterop struct {
	XMLName     xml.Name        `xml:"questestinterop"`
	Assessments []qtiAssessment `xml:"assessment"`
}

type qtiAssessment struct {
	XMLName  xml.Name      `xml:"assessment"`
	Ident    string        `xml:"ident,attr"`
	Title    string        `xml:"title,attr"`
	MetaData qtiMetaData   `xml:"qtimetadata"`
	Sections []qtiSection  `xml:"section"`
}

type qtiMetaData struct {
	Fields []qtiMetaDataField `xml:"qtimetadatafield"`
}

type qtiMetaDataField struct {
	Label string `xml:"fieldlabel"`
	Entry string `xml:"fieldentry"`
}

type qtiSection struct {
	XMLName  xml.Name   `xml:"section"`
	Ident    string     `xml:"ident,attr"`
	Title    string     `xml:"title,attr"`
	Items    []qtiItem  `xml:"item"`
	Sections []qtiSection `xml:"section"`
}

type qtiItem struct {
	XMLName          xml.Name             `xml:"item"`
	Ident            string               `xml:"ident,attr"`
	Title            string               `xml:"title,attr"`
	MetaData         qtiItemMetaData      `xml:"itemmetadata"`
	Presentation     qtiPresentation      `xml:"presentation"`
	ResponseProcessing qtiResProcessing   `xml:"resprocessing"`
	Feedbacks        []qtiItemFeedback    `xml:"itemfeedback"`
}

type qtiItemMetaData struct {
	Fields []qtiMetaDataField `xml:"qtimetadata>qtimetadatafield"`
}

type qtiPresentation struct {
	Material   qtiMaterial    `xml:"material"`
	Responses  []qtiResponse  `xml:"response_lid"`
	ResponseStr []qtiResponseStr `xml:"response_str"`
}

type qtiMaterial struct {
	MatText qtiMatText `xml:"mattext"`
}

type qtiMatText struct {
	TextType string `xml:"texttype,attr"`
	Text     string `xml:",chardata"`
}

type qtiResponse struct {
	Ident        string           `xml:"ident,attr"`
	RCardinality string           `xml:"rcardinality,attr"`
	RenderChoice qtiRenderChoice  `xml:"render_choice"`
}

type qtiResponseStr struct {
	Ident        string         `xml:"ident,attr"`
	RCardinality string         `xml:"rcardinality,attr"`
	RenderFib    qtiRenderFib   `xml:"render_fib"`
}

type qtiRenderFib struct {
	Rows    int    `xml:"rows,attr"`
	Columns int    `xml:"columns,attr"`
}

type qtiRenderChoice struct {
	Labels []qtiResponseLabel `xml:"response_label"`
}

type qtiResponseLabel struct {
	Ident    string      `xml:"ident,attr"`
	Material qtiMaterial `xml:"material"`
}

type qtiResProcessing struct {
	Outcomes   qtiOutcomes      `xml:"outcomes"`
	Conditions []qtiResCondition `xml:"respcondition"`
}

type qtiOutcomes struct {
	DecVars []qtiDecVar `xml:"decvar"`
}

type qtiDecVar struct {
	MaxValue string `xml:"maxvalue,attr"`
	MinValue string `xml:"minvalue,attr"`
	VarName  string `xml:"varname,attr"`
	VarType  string `xml:"vartype,attr"`
}

type qtiResCondition struct {
	Continue      string           `xml:"continue,attr"`
	ConditionVar  qtiConditionVar  `xml:"conditionvar"`
	SetVars       []qtiSetVar      `xml:"setvar"`
	DisplayFeedback []qtiDisplayFeedback `xml:"displayfeedback"`
}

type qtiConditionVar struct {
	VarEqual []qtiVarEqual `xml:"varequal"`
	And      *qtiCondAnd   `xml:"and"`
	Other    *struct{}     `xml:"other"`
}

type qtiCondAnd struct {
	VarEqual []qtiVarEqual `xml:"varequal"`
}

type qtiVarEqual struct {
	RespIdent string `xml:"respident,attr"`
	Value     string `xml:",chardata"`
}

type qtiSetVar struct {
	VarName string `xml:"varname,attr"`
	Action  string `xml:"action,attr"`
	Value   string `xml:",chardata"`
}

type qtiDisplayFeedback struct {
	FeedbackType string `xml:"feedbacktype,attr"`
	LinkRefID    string `xml:"linkrefid,attr"`
}

type qtiItemFeedback struct {
	Ident    string      `xml:"ident,attr"`
	Material qtiMaterial `xml:"flow_mat>material"`
}

// ParseQTIAssessment parses QTI 1.2/2.1 XML data and returns quiz metadata with questions.
func ParseQTIAssessment(data []byte) (*QTIResult, error) {
	// Try QTI 1.2 first (Canvas primary format)
	result, err := parseQTI12(data)
	if err == nil && result != nil {
		return result, nil
	}

	// Fall back to a simpler parse for variant XML structures
	return parseQTIFallback(data)
}

func parseQTI12(data []byte) (*QTIResult, error) {
	var interop qtiQuestestinterop
	if err := xml.Unmarshal(data, &interop); err != nil {
		return nil, fmt.Errorf("failed to parse QTI XML: %w", err)
	}

	if len(interop.Assessments) == 0 {
		return nil, fmt.Errorf("no assessments found in QTI XML")
	}

	assessment := interop.Assessments[0]
	result := &QTIResult{
		Title:    assessment.Title,
		QuizType: "assignment",
	}

	// Parse assessment-level metadata
	for _, field := range assessment.MetaData.Fields {
		switch field.Label {
		case "cc_maxattempts":
			// Max attempts
		case "qmd_timelimit":
			if tl, err := strconv.Atoi(field.Entry); err == nil {
				result.TimeLimit = &tl
			}
		case "quiz_type":
			result.QuizType = field.Entry
		}
	}

	// Parse items from all sections
	position := 1
	var totalPoints float64
	for _, section := range assessment.Sections {
		items := collectItems(section)
		for _, item := range items {
			question := parseQTIItem(item, position)
			if question.PointsPossible != nil {
				totalPoints += *question.PointsPossible
			}
			result.Questions = append(result.Questions, question)
			position++
		}
	}

	result.PointsPossible = totalPoints

	return result, nil
}

// collectItems recursively collects all items from sections and nested sections.
func collectItems(section qtiSection) []qtiItem {
	items := make([]qtiItem, 0, len(section.Items))
	items = append(items, section.Items...)
	for _, sub := range section.Sections {
		items = append(items, collectItems(sub)...)
	}
	return items
}

func parseQTIItem(item qtiItem, position int) models.QuizQuestion {
	questionType := detectQuestionType(item)
	questionText := extractQuestionText(item)
	points := extractPointsPossible(item)
	answers := extractAnswers(item, questionType)
	correctComments, incorrectComments := extractFeedback(item)

	answersJSON, _ := json.Marshal(answers)

	q := models.QuizQuestion{
		Position:          position,
		QuestionType:      questionType,
		QuestionText:      questionText,
		PointsPossible:    points,
		Answers:           string(answersJSON),
		CorrectComments:   correctComments,
		IncorrectComments: incorrectComments,
		WorkflowState:     "active",
	}

	return q
}

func detectQuestionType(item qtiItem) string {
	// Check metadata for explicit question type (Canvas extension)
	for _, field := range item.MetaData.Fields {
		if field.Label == "question_type" {
			return field.Entry
		}
	}

	// Infer from item structure
	hasResponseLid := len(item.Presentation.Responses) > 0
	hasResponseStr := len(item.Presentation.ResponseStr) > 0

	if hasResponseStr {
		// Check if it's an essay (multi-row) or short answer
		for _, rs := range item.Presentation.ResponseStr {
			if rs.RenderFib.Rows > 1 {
				return "essay"
			}
		}
		return "short_answer"
	}

	if hasResponseLid {
		resp := item.Presentation.Responses[0]
		labels := resp.RenderChoice.Labels

		// True/false: exactly 2 choices with true/false values
		if len(labels) == 2 {
			texts := make([]string, 2)
			for i, l := range labels {
				texts[i] = strings.ToLower(strings.TrimSpace(extractMatText(l.Material)))
			}
			if (texts[0] == "true" && texts[1] == "false") || (texts[0] == "false" && texts[1] == "true") {
				return "true_false"
			}
		}

		// Check cardinality for multiple answers
		if resp.RCardinality == "Multiple" {
			return "multiple_choice"
		}

		// If multiple response_lid elements, it could be matching
		if len(item.Presentation.Responses) > 1 {
			return "matching"
		}

		return "multiple_choice"
	}

	return "essay"
}

func extractQuestionText(item qtiItem) string {
	text := extractMatText(item.Presentation.Material)
	if text == "" {
		text = item.Title
	}
	return text
}

func extractMatText(mat qtiMaterial) string {
	text := mat.MatText.Text
	if mat.MatText.TextType == "text/html" {
		// Keep HTML as-is for rich text support
		return text
	}
	return html.UnescapeString(text)
}

func extractPointsPossible(item qtiItem) *float64 {
	// Check metadata first
	for _, field := range item.MetaData.Fields {
		if field.Label == "points_possible" {
			if pts, err := strconv.ParseFloat(field.Entry, 64); err == nil {
				return &pts
			}
		}
	}

	// Check outcomes decvar
	for _, dv := range item.ResponseProcessing.Outcomes.DecVars {
		if dv.MaxValue != "" {
			if pts, err := strconv.ParseFloat(dv.MaxValue, 64); err == nil {
				return &pts
			}
		}
	}

	// Default to 1 point
	defaultPts := 1.0
	return &defaultPts
}

// answerChoice represents a single answer option for a quiz question.
type answerChoice struct {
	ID       string  `json:"id"`
	Text     string  `json:"text"`
	Comments string  `json:"comments,omitempty"`
	Weight   float64 `json:"weight"` // 100 = correct, 0 = incorrect
}

func extractAnswers(item qtiItem, questionType string) []answerChoice {
	switch questionType {
	case "multiple_choice", "true_false":
		return extractMultipleChoiceAnswers(item)
	case "short_answer", "fill_in_multiple_blanks":
		return extractShortAnswers(item)
	case "matching":
		return extractMatchingAnswers(item)
	case "numerical_question":
		return extractNumericalAnswers(item)
	case "essay":
		return nil
	default:
		return extractMultipleChoiceAnswers(item)
	}
}

func extractMultipleChoiceAnswers(item qtiItem) []answerChoice {
	if len(item.Presentation.Responses) == 0 {
		return nil
	}

	resp := item.Presentation.Responses[0]
	labels := resp.RenderChoice.Labels

	// Build a map of label ident -> correct weight
	correctMap := buildCorrectMap(item)

	answers := make([]answerChoice, 0, len(labels))
	for _, label := range labels {
		weight := 0.0
		if w, ok := correctMap[label.Ident]; ok {
			weight = w
		}

		answers = append(answers, answerChoice{
			ID:     label.Ident,
			Text:   extractMatText(label.Material),
			Weight: weight,
		})
	}

	return answers
}

func extractShortAnswers(item qtiItem) []answerChoice {
	// Short answers are determined from respconditions
	var answers []answerChoice
	for _, cond := range item.ResponseProcessing.Conditions {
		for _, sv := range cond.SetVars {
			val, err := strconv.ParseFloat(sv.Value, 64)
			if err != nil || val <= 0 {
				continue
			}
		}

		// Extract the expected text values
		for _, ve := range cond.ConditionVar.VarEqual {
			weight := 0.0
			for _, sv := range cond.SetVars {
				if v, err := strconv.ParseFloat(sv.Value, 64); err == nil && v > 0 {
					weight = 100.0
					break
				}
			}
			if weight > 0 {
				answers = append(answers, answerChoice{
					ID:     ve.Value,
					Text:   ve.Value,
					Weight: weight,
				})
			}
		}
	}
	return answers
}

func extractMatchingAnswers(item qtiItem) []answerChoice {
	var answers []answerChoice
	for _, resp := range item.Presentation.Responses {
		for _, label := range resp.RenderChoice.Labels {
			answers = append(answers, answerChoice{
				ID:     label.Ident,
				Text:   extractMatText(label.Material),
				Weight: 0,
			})
		}
	}
	return answers
}

func extractNumericalAnswers(item qtiItem) []answerChoice {
	var answers []answerChoice
	for _, cond := range item.ResponseProcessing.Conditions {
		for _, ve := range cond.ConditionVar.VarEqual {
			weight := 0.0
			for _, sv := range cond.SetVars {
				if v, err := strconv.ParseFloat(sv.Value, 64); err == nil && v > 0 {
					weight = 100.0
					break
				}
			}
			if weight > 0 {
				answers = append(answers, answerChoice{
					ID:     ve.Value,
					Text:   ve.Value,
					Weight: weight,
				})
			}
		}
	}
	return answers
}

func buildCorrectMap(item qtiItem) map[string]float64 {
	correctMap := make(map[string]float64)
	for _, cond := range item.ResponseProcessing.Conditions {
		// Determine the score for this condition
		score := 0.0
		for _, sv := range cond.SetVars {
			if v, err := strconv.ParseFloat(sv.Value, 64); err == nil && v > 0 {
				score = 100.0
				break
			}
		}

		// Map each varequal ident to the score
		for _, ve := range cond.ConditionVar.VarEqual {
			if score > 0 {
				correctMap[ve.Value] = score
			}
		}

		// Check inside <and> block
		if cond.ConditionVar.And != nil {
			for _, ve := range cond.ConditionVar.And.VarEqual {
				if score > 0 {
					correctMap[ve.Value] = score
				}
			}
		}
	}
	return correctMap
}

func extractFeedback(item qtiItem) (correctComments string, incorrectComments string) {
	feedbackMap := make(map[string]string)
	for _, fb := range item.Feedbacks {
		text := extractMatText(fb.Material)
		feedbackMap[fb.Ident] = text
	}

	// Scan respconditions for feedback references
	for _, cond := range item.ResponseProcessing.Conditions {
		isCorrect := false
		for _, sv := range cond.SetVars {
			if v, err := strconv.ParseFloat(sv.Value, 64); err == nil && v > 0 {
				isCorrect = true
				break
			}
		}

		for _, df := range cond.DisplayFeedback {
			text := feedbackMap[df.LinkRefID]
			if text == "" {
				continue
			}
			if isCorrect {
				correctComments = text
			} else {
				incorrectComments = text
			}
		}
	}

	// Also check for well-known Canvas feedback idents
	if text, ok := feedbackMap["correct_fb"]; ok && correctComments == "" {
		correctComments = text
	}
	if text, ok := feedbackMap["general_correct_fb"]; ok && correctComments == "" {
		correctComments = text
	}
	if text, ok := feedbackMap["incorrect_fb"]; ok && incorrectComments == "" {
		incorrectComments = text
	}
	if text, ok := feedbackMap["general_incorrect_fb"]; ok && incorrectComments == "" {
		incorrectComments = text
	}

	return correctComments, incorrectComments
}

// parseQTIFallback attempts a simpler parse for non-standard or QTI 2.1 XML.
func parseQTIFallback(data []byte) (*QTIResult, error) {
	// Try parsing as a single assessment element (no questestinterop wrapper)
	type simpleAssessment struct {
		XMLName  xml.Name     `xml:"assessment"`
		Title    string       `xml:"title,attr"`
		Sections []qtiSection `xml:"section"`
	}

	var sa simpleAssessment
	if err := xml.Unmarshal(data, &sa); err != nil {
		return nil, fmt.Errorf("failed to parse QTI XML in fallback mode: %w", err)
	}

	result := &QTIResult{
		Title:    sa.Title,
		QuizType: "assignment",
	}

	position := 1
	var totalPoints float64
	for _, section := range sa.Sections {
		items := collectItems(section)
		for _, item := range items {
			question := parseQTIItem(item, position)
			if question.PointsPossible != nil {
				totalPoints += *question.PointsPossible
			}
			result.Questions = append(result.Questions, question)
			position++
		}
	}
	result.PointsPossible = totalPoints

	return result, nil
}
