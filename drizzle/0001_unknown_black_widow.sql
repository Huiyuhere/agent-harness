CREATE TABLE `agent_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`project_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`context_receipt_json` text NOT NULL,
	`status` text NOT NULL,
	`duration_ms` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `agent_threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_agent_messages_thread_created` ON `agent_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agent_messages_project_owner` ON `agent_messages` (`project_id`,`owner_id`);--> statement-breakpoint
CREATE TABLE `design_document_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`base_hash` text NOT NULL,
	`original_content` text NOT NULL,
	`proposed_content` text NOT NULL,
	`diff` text NOT NULL,
	`rationale` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_document_proposals_project_status` ON `design_document_proposals` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_document_proposals_owner` ON `design_document_proposals` (`owner_id`);--> statement-breakpoint
CREATE TABLE `flow_gaps` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`frame_id` text NOT NULL,
	`node` text NOT NULL,
	`label` text NOT NULL,
	`role` text NOT NULL,
	`source_anchor_json` text NOT NULL,
	`computed_style_json` text NOT NULL,
	`click_count` integer NOT NULL,
	`suggested_route` text NOT NULL,
	`screenshot_key` text,
	`status` text NOT NULL,
	`transaction_id` text,
	`first_seen_at` text NOT NULL,
	`last_clicked_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_flow_gaps_project_frame_node` ON `flow_gaps` (`project_id`,`frame_id`,`node`);--> statement-breakpoint
CREATE INDEX `idx_flow_gaps_project_status` ON `flow_gaps` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_context_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`source_hash` text NOT NULL,
	`content` text NOT NULL,
	`parsed_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_context_project_path_hash` ON `project_context_snapshots` (`project_id`,`path`,`source_hash`);--> statement-breakpoint
CREATE INDEX `idx_context_project_owner` ON `project_context_snapshots` (`project_id`,`owner_id`);