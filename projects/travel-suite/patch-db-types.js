const fs = require('fs');

const WEbTypes = 'apps/web/src/lib/database.types.ts';
const SharedTypes = 'packages/shared/src/database.types.ts';

const files = [WEbTypes, SharedTypes];

const newTables = `      social_connections: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          organization_id: string
          platform: string
          platform_page_id: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          id?: string
          organization_id: string
          platform: string
          platform_page_id: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          organization_id?: string
          platform?: string
          platform_page_id?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_library: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string
          id: string
          mime_type: string | null
          organization_id: string
          source: string
          source_contact_phone: string | null
          tags: Json | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          mime_type?: string | null
          organization_id: string
          source?: string
          source_contact_phone?: string | null
          tags?: Json | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          source?: string
          source_contact_phone?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_queue: {
        Row: {
          attempts: number
          connection_id: string
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          platform_post_url: string | null
          post_id: string
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          connection_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          post_id: string
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          connection_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          post_id?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_queue_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption_facebook: string | null
          caption_instagram: string | null
          created_at: string
          created_by: string | null
          hashtags: string | null
          id: string
          organization_id: string
          rendered_image_url: string | null
          rendered_image_urls: string[] | null
          source: string
          status: string
          template_data: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          caption_facebook?: string | null
          caption_instagram?: string | null
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          organization_id: string
          rendered_image_url?: string | null
          rendered_image_urls?: string[] | null
          source?: string
          status?: string
          template_data?: Json
          template_id: string
          updated_at?: string
        }
        Update: {
          caption_facebook?: string | null
          caption_instagram?: string | null
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          organization_id?: string
          rendered_image_url?: string | null
          rendered_image_urls?: string[] | null
          source?: string
          status?: string
          template_data?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_reviews: {
        Row: {
          comment: string | null
          created_at: string
          destination: string | null
          id: string
          is_featured: boolean
          organization_id: string
          rating: number | null
          reviewer_name: string
          source: string
          trip_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_featured?: boolean
          organization_id: string
          rating?: number | null
          reviewer_name: string
          source?: string
          trip_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_featured?: boolean
          organization_id?: string
          rating?: number | null
          reviewer_name?: string
          source?: string
          trip_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('social_posts: {')) {
    console.log(file + ' already has types. skipped.');
    continue;
  }
  
  // Find the Tables: { block end and insert before it
  // Actually, we can just insert before `subscriptions: {` which is alphabetically after `social...`
  // Wait, let's just insert it inside `Tables: {`
  content = content.replace('Tables: {', 'Tables: {\n' + newTables + '\n');
  fs.writeFileSync(file, content);
  console.log(file + ' updated.');
}
