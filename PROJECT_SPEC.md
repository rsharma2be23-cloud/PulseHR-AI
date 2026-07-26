# PulseHR AI — Project Specification

## 1. Project overview

PulseHR AI is an AI-powered workforce intelligence and employee-retention platform for a final-year B.Tech Computer Science portfolio. It combines a MERN web application with focused machine-learning, NLP, retrieval-augmented generation (RAG), and one tool-using AI agent.

The system helps authorized employees, managers, HR staff, and administrators work with workforce data, understand attrition-risk predictions, analyse feedback sentiment, retrieve demo HR policies, and receive evidence-backed guidance. It is designed to demonstrate strong junior SDE/AI engineering practices without pretending to be a production-scale enterprise HR suite.

## 2. Problem statement

Organizations often hold workforce information across attendance, performance, surveys, feedback, and policy documents. Turning this data into timely, explainable retention insights is difficult. Managers need useful recommendations, but these must be grounded in authorized employee records and company policy rather than generated guesses.

PulseHR AI addresses this by bringing workforce data and bounded AI assistance into one application. It predicts attrition risk as a probabilistic decision-support signal, explains key model drivers, analyses feedback sentiment, and enables policy-grounded coaching conversations. It never makes hiring, firing, or resignation decisions.

## 3. Objectives

- Manage core employee and workforce records with role-appropriate access.
- Train and serve an employee attrition-risk prediction model.
- Explain individual predictions with SHAP.
- Analyse employee feedback sentiment using a practical lightweight NLP approach.
- Retrieve relevant synthetic/demo HR policies through RAG.
- Generate grounded, structured HR insights using Groq-hosted Llama-family models.
- Provide one meaningful Manager Coaching Agent that selects only the tools needed for a question.
- Provide a conversational HR Copilot for authorized workforce analytics queries.
- Produce an understandable, clean, interview-ready codebase.

## 4. Functional requirements

### 4.1 Authentication and access

- Users can register or be created by an administrator, sign in, and sign out.
- Passwords are hashed with bcrypt; sessions use JWTs.
- Every protected API checks authentication and role-based authorization.
- Access to employee data is scoped to the authenticated user’s permitted employees and department.

### 4.2 Workforce data

- Maintain employee profiles, departments, attendance, performance reviews, surveys, and feedback.
- Support practical list pagination, filtering, and search where datasets can grow.
- Let authorized users view dashboard summaries appropriate to their role.

### 4.3 Analytics and AI

- Analyse employee feedback sentiment and store/recompute its result when appropriate.
- Request attrition-risk inference for an authorized employee.
- Display prediction probability/risk band and an explicit statement that it is a model prediction, not a fact.
- Display SHAP-based contributing factors for a prediction.
- Retrieve relevant policy passages from the demo HR knowledge base.
- Generate grounded insights with citations/evidence references from supplied records and retrieved policy chunks.
- Provide an HR Copilot and Manager Coaching Agent with session-level conversation context.

## 5. User roles

| Role | Primary permissions |
| --- | --- |
| Employee | View their own profile, permitted personal records, feedback/survey actions, and personal dashboard. |
| Manager | View authorized direct-report/team information, team dashboard, and use the Manager Coaching Agent for their team. |
| HR | Manage workforce records across authorized organization scope, review analytics, policies, and HR dashboard. |
| Admin | Manage users, roles, departments, system configuration, and all authorized administrative views. |

Exact ownership rules (for example, direct-report mapping) must be enforced in backend authorization services, not only hidden in the UI.

## 6. Technology stack

| Area | Technology | Reason |
| --- | --- | --- |
| Frontend | React.js, JavaScript, Tailwind CSS | Component-based UI with rapid, consistent styling. |
| Client routing/state | React Router; Redux Toolkit only for genuine shared state | Clear routing; avoids unnecessary global-state complexity. |
| Charts | Recharts | Straightforward dashboards and analytics charts. |
| Backend | Node.js, Express.js, JavaScript | Familiar MERN API layer with readable application code. |
| Validation/data access | Zod, Mongoose | Runtime request validation and MongoDB object modeling. |
| Database | MongoDB Atlas | Managed document database suitable for workforce records. |
| Authentication | JWT, bcrypt, RBAC | Stateless API authentication with secure password storage and role checks. |
| ML | Python, Pandas, NumPy, scikit-learn, XGBoost, Joblib | Practical tabular-data training, comparison, persistence, and inference. |
| Explainability | SHAP | Per-prediction explanation of model drivers. |
| NLP | VADER or DistilBERT, chosen after deployment evaluation | VADER is the default lightweight baseline; DistilBERT is justified only if quality gains and deployment cost warrant it. |
| Generative AI | Groq-hosted Llama-family model | Fast LLM inference for structured, grounded assistance. |
| RAG/vector store | ChromaDB | Local/lightweight vector retrieval over demo policy documents. |
| Agent orchestration | LangChain | Controlled tools and conversational state for one Manager Coaching Agent. |

No major dependency may be introduced without a clear purpose and explanation.

## 7. High-level architecture

```text
React.js + JavaScript frontend
        |
        | HTTPS / JSON, JWT
        v
Express.js + JavaScript API
  |-- auth, RBAC, validation, business services
  |-- MongoDB Atlas (workforce data)
  |-- Python ML inference boundary (attrition, SHAP, sentiment)
  |-- RAG service (policy documents -> ChromaDB -> retrieval)
  '-- GenAI service / LangChain Manager Coaching Agent -> Groq Llama
```

The application remains a modular monolith: one frontend and one primary backend, with a clearly separated lightweight ML/AI boundary. This is easier for one student to develop, test, deploy, and explain than a microservice-heavy design.

## 8. MERN architecture

### Frontend

- React pages are grouped by feature and protected by role-aware routing.
- Reusable UI components render forms, tables, cards, charts, and AI evidence panels.
- React Router manages navigation.
- Redux Toolkit is reserved for cross-cutting state such as authenticated user/session metadata or shared filters; feature-local state stays local.
- API calls use a small client service layer; frontend authorization improves UX but never replaces backend checks.

### Backend

Each API feature follows this flow:

```text
Route -> authentication/authorization middleware -> Zod validation
      -> controller -> service -> Mongoose model/data access
```

- Routes define endpoints and compose middleware only.
- Controllers translate HTTP input/output and call services.
- Services contain business rules, ownership checks, and AI/ML orchestration.
- Mongoose models represent persisted MongoDB collections.
- Central error middleware maps known errors to safe HTTP responses.

Likely core entities are User, Employee, Department, AttendanceRecord, PerformanceReview, SurveyResponse, Feedback, AttritionAssessment, ConversationSession, and policy-document metadata. The final schema will be designed only when its phase starts.

## 9. ML architecture

The primary ML task is tabular employee attrition-risk prediction. Training and inference code are isolated from regular API business logic.

```text
Approved/demo dataset
  -> EDA and data-quality checks
  -> preprocessing + justified feature engineering
  -> train/validation/test split
  -> baseline model and candidate comparison
  -> imbalance analysis and justified tuning
  -> evaluation + persisted artifact
  -> controlled inference endpoint/service
  -> SHAP explanation for individual prediction
```

Requirements:

- Use Pandas and NumPy for data preparation; scikit-learn and XGBoost for modeling; Joblib for persistence.
- Establish a simple baseline before comparing more capable models.
- Use a train/validation/test methodology that prevents test-set leakage.
- Evaluate precision, recall, F1, ROC-AUC, and a confusion matrix; inspect class imbalance.
- Perform hyperparameter tuning only when it is justified and reproducible.
- Persist preprocessing and model artifacts together so inference uses the same transformations as training.
- Record actual measured metrics in project documentation only after experiments run; never invent accuracy values.
- Return probability/risk bands and uncertainty-aware wording, never a claim that an employee will resign.

## 10. GenAI architecture

GenAI is an evidence-bounded reasoning layer, not a generic chatbot wrapper.

```text
Authorized user query + scoped employee/policy evidence
  -> prompt/context builder
  -> Groq-hosted Llama-family model
  -> structured response
  -> Zod schema validation
  -> safe API response with evidence references
```

- System prompts define role, scope, uncertainty language, and non-fabrication rules.
- Context contains only records the requester is authorized to access.
- Responses use structured schemas where practical, such as summary, findings, recommendations, caveats, and evidence references.
- Zod validates model output; failed validation is retried with a repair prompt or returned as a safe unavailable response.
- Basic evaluation uses a small curated set of representative prompts to check grounding, structure, refusal/unavailability behavior, and policy citation quality.

## 11. RAG architecture

RAG is limited to synthetic/demo HR policies, never confidential real-company documents.

```text
Demo policy documents
  -> text extraction
  -> chunking with metadata
  -> embeddings
  -> ChromaDB collection
  -> query embedding + top relevant chunks
  -> grounded LLM response with source references
```

Initial policy content can cover promotion, employee handbook, leave, work-from-home, and career-development policies.

Retrieved chunks are supplied as evidence. If retrieval produces no adequate support, the response must say that the policy information is unavailable rather than inventing a policy.

## 12. Agentic AI architecture

The system has exactly one agent: the Manager Coaching Agent. It is a controlled LangChain tool-using workflow, not a multi-agent system.

```text
Manager question + session context
  -> authorization and employee-scope resolution
  -> LangChain agent chooses necessary tool(s)
  -> tool results (authorized evidence only)
  -> grounded recommendation with cited evidence
  -> conversation session update
```

- The agent dynamically selects tools based on the question; it must not call every tool by default.
- Session-level state retains relevant context such as a previously discussed employee, while authorization is rechecked for every tool call.
- Tool outputs are structured and treated as the only factual basis for employee-specific claims.
- The agent is advisory only: it cannot make or execute employment decisions.

## 13. Agent tools

| Tool | Purpose | Typical use |
| --- | --- | --- |
| `getEmployeeData` | Retrieve authorized employee profile/context. | Identity, department, employment facts. |
| `getPerformance` | Retrieve authorized performance-review data. | Questions about performance trends. |
| `getSurvey` | Retrieve authorized survey information. | Engagement or survey concerns. |
| `getSentiment` | Retrieve feedback sentiment results/evidence. | Questions about feedback tone or themes. |
| `getAttritionPrediction` | Retrieve the latest model assessment. | “What is EMP101’s attrition risk?” |
| `getSHAPExplanation` | Retrieve drivers for a specific assessment. | “Why is EMP101 at risk?” |
| `searchHRPolicies` | Retrieve relevant demo policy chunks. | Policy-grounded recommendations. |

For example, an attrition-risk question may use only `getAttritionPrediction`; a why-and-what-to-do question may additionally use SHAP, relevant performance/sentiment data, and policy search. Tools must validate caller scope and input identifiers independently.

## 14. AI guardrails

- Never invent employee facts, predictions, performance records, sentiment results, or policies.
- Clearly say when requested data, a model result, or relevant policy evidence is unavailable.
- Treat attrition output as a prediction/probability, not a factual future event.
- Use calibrated wording such as “may indicate elevated risk,” never “will resign.”
- Restrict context and tool access to data authorized for the current user.
- Ground important recommendations in identified tool outputs and/or retrieved policy chunks.
- Exclude sensitive or irrelevant information from prompts and responses.
- Validate structured LLM outputs with Zod before returning them.
- Log safe operational metadata for debugging/evaluation without exposing secrets or unnecessary employee content.
- Do not enable automatic hiring, firing, disciplinary, or other employment decisions.

## 15. Security requirements

- Store secrets only in environment variables; never commit them.
- Hash passwords with bcrypt and issue signed, expiring JWTs.
- Authenticate protected endpoints and enforce RBAC plus record-level ownership checks.
- Validate request bodies, parameters, and query strings with Zod.
- Use Helmet, CORS allowlists, and rate limiting in the API.
- Return appropriate HTTP status codes and safe centralized error messages.
- Apply pagination and query limits to list endpoints.
- Avoid logging passwords, tokens, provider keys, or raw sensitive content unnecessarily.
- Use TLS-supported managed services in deployment and restrict database credentials/access.
- Treat all LLM and RAG input as untrusted; resist prompt injection by separating instructions from retrieved content and restricting actions to approved tools.

## 16. Non-functional requirements

- **Usability:** Role-specific dashboards and clear explanations for predictions and evidence.
- **Maintainability:** Small, descriptive modules and documented architectural decisions.
- **Reliability:** Graceful failures for ML, vector-store, and LLM-provider unavailability.
- **Performance:** Paginated lists, bounded RAG retrieval, and appropriately sized model/artifact deployment.
- **Observability:** Basic request/error logging and AI evaluation records suitable for a student project.
- **Accessibility:** Semantic forms, keyboard-friendly navigation, readable contrast, and meaningful error messages.
- **Privacy:** Demo/synthetic data by default; no confidential company documents or data required.
- **Testability:** Core rules designed as services/functions that can be tested without a full UI stack.

## 17. Out-of-scope features

The following are explicitly excluded unless requested later:

- Multi-agent systems, agent swarms, CrewAI, or AutoGen.
- Graph neural networks.
- Kafka, complex event streaming, Kubernetes, or microservice proliferation.
- Digital twins, workforce simulation, blockchain, or multi-tenant SaaS.
- Automatic hiring, firing, promotion, or retention actions.
- Unnecessary cloud infrastructure or design-pattern layers.
- Docker and CI/CD before the core application is working.
- Real confidential company policy documents or employee datasets.

## 18. Development principles

1. Work incrementally and implement only the explicitly approved phase.
2. Prefer readable, descriptive code over clever abstractions.
3. Keep files focused; avoid huge files and premature generic frameworks.
4. Comment non-obvious decisions and logic, not self-evident lines.
5. Explain significant architectural choices and new dependencies before introducing them.
6. Keep the application a strong fresher/junior portfolio project, not a simulated enterprise platform.
7. Keep ML/AI code separate from normal backend business logic.
8. Do not change architecture silently.
9. Never fabricate results, metrics, data, or policy evidence.
10. For every phase: explain purpose, list changed files, implement only that phase, explain key code, give run/test commands, state manual verification, then stop.

## 19. Development phases

Each phase requires explicit approval before the next one begins.

1. **Project specification (current):** Create and approve this specification; no application code.
2. **Repository and backend foundation:** Establish the minimal project structure, JavaScript Express API, environment conventions, linting/formatting choices, and health check.
3. **Database and authentication:** Add MongoDB connection, user model, JWT authentication, bcrypt passwords, RBAC middleware, and focused tests.
4. **Core workforce modules:** Implement departments, employees, attendance, performance reviews, surveys, and feedback APIs with scoped authorization.
5. **Frontend foundation and dashboards:** Build the React app shell, authentication flow, protected routes, and role-oriented dashboard foundations.
6. **Workforce management UI:** Add forms, lists, pagination/filtering, and role-appropriate record views.
7. **ML experimentation:** Perform EDA, preprocessing, baseline and model comparison, evaluation, artifact persistence, and document measured results.
8. **ML integration and explainability:** Add controlled inference, assessment storage/display, and SHAP explanation flow.
9. **Feedback sentiment:** Implement and evaluate the selected practical sentiment approach, then integrate results.
10. **RAG policy knowledge base:** Create synthetic policies, indexing pipeline, ChromaDB retrieval, grounded answers, and retrieval tests.
11. **GenAI insights and HR Copilot:** Add structured, validated Groq responses, prompts, grounding, guardrails, and basic AI evaluation.
12. **Manager Coaching Agent:** Implement LangChain tools, selective tool use, session context, evidence-led responses, and tool-selection tests.
13. **Quality hardening:** Add the most valuable API, authorization, validation, ML, RAG, and AI-response tests; improve error handling and accessibility.
14. **Deployment and portfolio polish:** Deploy frontend, backend, database, and lightweight ML component; add Docker/CI only if now useful; prepare demo, documentation, and architecture explanation.

## 20. Definition of project completion

PulseHR AI is complete when it:

- Provides a deployed or demonstrably runnable React.js/JavaScript frontend and Express.js/JavaScript backend.
- Supports secure JWT authentication, RBAC, and record-level access controls for Employee, Manager, HR, and Admin roles.
- Manages the defined core workforce records through usable, validated interfaces/APIs.
- Includes a reproducible attrition ML workflow with genuine documented evaluation results, persisted inference artifacts, and SHAP explanations.
- Includes an appropriately evaluated feedback sentiment feature.
- Retrieves answers from synthetic/demo HR policies through a functioning ChromaDB RAG pipeline with evidence references.
- Uses Groq-hosted Llama-family models for validated, grounded HR insights rather than unbounded chat.
- Includes one Manager Coaching Agent that demonstrably chooses relevant tools, retains limited session context, and grounds recommendations in authorized evidence.
- Includes an HR Copilot within the same safety and authorization boundaries.
- Has proportionate tests for authentication, authorization, critical APIs, validation, ML preprocessing/inference, RAG retrieval, agent tool selection, and structured AI responses.
- Can be explained clearly by its author: every major component has a stated purpose, known limitation, and manual verification path.
