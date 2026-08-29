import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const owners = sqliteTable("owners", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("idx_owners_email").on(table.email)]);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  name: text("name").notNull(),
  repositoryFullName: text("repository_full_name").notNull(),
  baseSha: text("base_sha").notNull(),
  draftBranch: text("draft_branch").notNull(),
  packageManager: text("package_manager"),
  framework: text("framework"),
  trustGrantedAt: text("trust_granted_at"),
  ...timestamps,
}, (table) => [index("idx_projects_owner_id").on(table.ownerId)]);

export const githubInstallations = sqliteTable("github_installations", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  installationId: text("installation_id").notNull(),
  accountLogin: text("account_login").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("idx_github_installations_installation_id").on(table.installationId)]);

export const routeFrames = sqliteTable("route_frames", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  route: text("route").notNull(), name: text("name").notNull(), viewportWidth: integer("viewport_width").notNull(), viewportHeight: integer("viewport_height").notNull(),
  x: integer("x").notNull(), y: integer("y").notNull(), thumbnailKey: text("thumbnail_key"), ...timestamps,
}, (table) => [index("idx_route_frames_project_id").on(table.projectId), uniqueIndex("idx_route_frames_project_route").on(table.projectId, table.route)]);

export const savedStates = sqliteTable("saved_states", {
  id: text("id").primaryKey(), frameId: text("frame_id").notNull().references(() => routeFrames.id), name: text("name").notNull(), fixtureJson: text("fixture_json").notNull(), screenshotKey: text("screenshot_key"), ...timestamps,
}, (table) => [index("idx_saved_states_frame_id").on(table.frameId)]);

export const graphEdges = sqliteTable("graph_edges", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), fromFrameId: text("from_frame_id").notNull(), toFrameId: text("to_frame_id").notNull(), kind: text("kind").notNull(), label: text("label"), ...timestamps,
}, (table) => [index("idx_graph_edges_project_id").on(table.projectId)]);

export const designSessions = sqliteTable("design_sessions", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), name: text("name").notNull(), localCommitSha: text("local_commit_sha"), status: text("status").notNull(), ...timestamps,
}, (table) => [index("idx_design_sessions_project_id").on(table.projectId)]);

export const editTransactions = sqliteTable("edit_transactions", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), sessionId: text("session_id").references(() => designSessions.id), baseSha: text("base_sha").notNull(), route: text("route").notNull(), stateId: text("state_id"), sourceAnchorJson: text("source_anchor_json").notNull(), operation: text("operation").notNull(), property: text("property").notNull(), beforeValue: text("before_value").notNull(), afterValue: text("after_value").notNull(), affectedFilesJson: text("affected_files_json").notNull(), inversePatch: text("inverse_patch").notNull(), validationJson: text("validation_json").notNull(), status: text("status").notNull(), ...timestamps,
}, (table) => [index("idx_edit_transactions_project_id_created_at").on(table.projectId, table.createdAt), index("idx_edit_transactions_session_id").on(table.sessionId)]);

export const agentThreads = sqliteTable("agent_threads", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), title: text("title").notNull(), model: text("model").notNull(), previousResponseId: text("previous_response_id"), ...timestamps,
}, (table) => [index("idx_agent_threads_project_id").on(table.projectId)]);

export const agentJobs = sqliteTable("agent_jobs", {
  id: text("id").primaryKey(), threadId: text("thread_id").notNull().references(() => agentThreads.id), repositoryId: text("repository_id").notNull(), kind: text("kind").notNull(), status: text("status").notNull(), progressJson: text("progress_json").notNull(), startedAt: text("started_at"), finishedAt: text("finished_at"), ...timestamps,
}, (table) => [index("idx_agent_jobs_repository_status").on(table.repositoryId, table.status), index("idx_agent_jobs_thread_id").on(table.threadId)]);

export const projectMemories = sqliteTable("project_memories", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), category: text("category").notNull(), content: text("content").notNull(), provenanceType: text("provenance_type").notNull(), provenanceId: text("provenance_id").notNull(), approvedBy: text("approved_by").notNull(), ...timestamps,
}, (table) => [index("idx_project_memories_project_category").on(table.projectId, table.category)]);

export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), kind: text("kind").notNull(), objectKey: text("object_key").notNull(), contentType: text("content_type").notNull(), encrypted: integer("encrypted", { mode: "boolean" }).notNull(), sizeBytes: integer("size_bytes").notNull(), ...timestamps,
}, (table) => [index("idx_artifacts_project_id").on(table.projectId), uniqueIndex("idx_artifacts_object_key").on(table.objectKey)]);
