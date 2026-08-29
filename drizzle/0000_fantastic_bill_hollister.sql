CREATE TABLE `agent_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`repository_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`progress_json` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `agent_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_agent_jobs_repository_status` ON `agent_jobs` (`repository_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agent_jobs_thread_id` ON `agent_jobs` (`thread_id`);--> statement-breakpoint
CREATE TABLE `agent_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`model` text NOT NULL,
	`previous_response_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_agent_threads_project_id` ON `agent_threads` (`project_id`);--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`encrypted` integer NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_artifacts_project_id` ON `artifacts` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_artifacts_object_key` ON `artifacts` (`object_key`);--> statement-breakpoint
CREATE TABLE `design_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`local_commit_sha` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_design_sessions_project_id` ON `design_sessions` (`project_id`);--> statement-breakpoint
CREATE TABLE `edit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`session_id` text,
	`base_sha` text NOT NULL,
	`route` text NOT NULL,
	`state_id` text,
	`source_anchor_json` text NOT NULL,
	`operation` text NOT NULL,
	`property` text NOT NULL,
	`before_value` text NOT NULL,
	`after_value` text NOT NULL,
	`affected_files_json` text NOT NULL,
	`inverse_patch` text NOT NULL,
	`validation_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `design_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_edit_transactions_project_id_created_at` ON `edit_transactions` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_edit_transactions_session_id` ON `edit_transactions` (`session_id`);--> statement-breakpoint
CREATE TABLE `github_installations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`account_login` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_github_installations_installation_id` ON `github_installations` (`installation_id`);--> statement-breakpoint
CREATE TABLE `graph_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`from_frame_id` text NOT NULL,
	`to_frame_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_graph_edges_project_id` ON `graph_edges` (`project_id`);--> statement-breakpoint
CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_owners_email` ON `owners` (`email`);--> statement-breakpoint
CREATE TABLE `project_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`provenance_type` text NOT NULL,
	`provenance_id` text NOT NULL,
	`approved_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_memories_project_category` ON `project_memories` (`project_id`,`category`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`repository_full_name` text NOT NULL,
	`base_sha` text NOT NULL,
	`draft_branch` text NOT NULL,
	`package_manager` text,
	`framework` text,
	`trust_granted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_projects_owner_id` ON `projects` (`owner_id`);--> statement-breakpoint
CREATE TABLE `route_frames` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`route` text NOT NULL,
	`name` text NOT NULL,
	`viewport_width` integer NOT NULL,
	`viewport_height` integer NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`thumbnail_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_route_frames_project_id` ON `route_frames` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_route_frames_project_route` ON `route_frames` (`project_id`,`route`);--> statement-breakpoint
CREATE TABLE `saved_states` (
	`id` text PRIMARY KEY NOT NULL,
	`frame_id` text NOT NULL,
	`name` text NOT NULL,
	`fixture_json` text NOT NULL,
	`screenshot_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`frame_id`) REFERENCES `route_frames`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_saved_states_frame_id` ON `saved_states` (`frame_id`);