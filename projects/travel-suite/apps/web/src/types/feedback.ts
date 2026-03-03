export interface ClientComment {
    id: string;
    author: string;
    comment: string;
    created_at: string;
    /** Set when operator marks comment as resolved */
    resolved_at?: string;
    resolved_by?: string;
    /** Operator's inline reply to this comment */
    operator_reply?: string;
    operator_reply_at?: string;
}

export interface ClientPreferences {
    budget_preference?: string;
    pace?: string;
    room_preference?: string;
    must_have?: string[];
    avoid?: string[];
    notes?: string;
}

export type FeedbackAction =
    | { action: "resolve_comment"; comment_id: string }
    | { action: "unresolve_comment"; comment_id: string }
    | { action: "reply_comment"; comment_id: string; reply: string }
    | { action: "resolve_all" };
