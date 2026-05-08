export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          id: string
          primary_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          enabled_via: string
          id: string
          module_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          enabled_via: string
          id?: string
          module_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          enabled_via?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tas: {
        Row: {
          accepted_at: string | null
          declined_at: string | null
          id: string
          invited_at: string
          invited_by_professor: string
          professor_course_id: string
          revoked_at: string | null
          slot_type: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          declined_at?: string | null
          id?: string
          invited_at?: string
          invited_by_professor: string
          professor_course_id: string
          revoked_at?: string | null
          slot_type: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          declined_at?: string | null
          id?: string
          invited_at?: string
          invited_by_professor?: string
          professor_course_id?: string
          revoked_at?: string | null
          slot_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tas_invited_by_professor_fkey"
            columns: ["invited_by_professor"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tas_professor_course_id_fkey"
            columns: ["professor_course_id"]
            isOneToOne: false
            referencedRelation: "professor_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_category: string | null
          course_name: string
          course_number: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          course_category?: string | null
          course_name: string
          course_number?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          course_category?: string | null
          course_name?: string
          course_number?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          document_number: string | null
          effective_date: string | null
          entity_type: string
          expiration_date: string | null
          fei_ein: string | null
          filed_at: string | null
          filed_by_user_id: string | null
          governance_structure: string | null
          id: string
          mailing_address: Json | null
          name: string
          name_normalized: string | null
          par_value: number | null
          principal_address: Json | null
          purpose: string | null
          registered_agent_address: Json | null
          registered_agent_name: string | null
          shares_authorized: number | null
          status: string
          type_specific_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          effective_date?: string | null
          entity_type: string
          expiration_date?: string | null
          fei_ein?: string | null
          filed_at?: string | null
          filed_by_user_id?: string | null
          governance_structure?: string | null
          id?: string
          mailing_address?: Json | null
          name: string
          name_normalized?: string | null
          par_value?: number | null
          principal_address?: Json | null
          purpose?: string | null
          registered_agent_address?: Json | null
          registered_agent_name?: string | null
          shares_authorized?: number | null
          status?: string
          type_specific_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          effective_date?: string | null
          entity_type?: string
          expiration_date?: string | null
          fei_ein?: string | null
          filed_at?: string | null
          filed_by_user_id?: string | null
          governance_structure?: string | null
          id?: string
          mailing_address?: Json | null
          name?: string
          name_normalized?: string | null
          par_value?: number | null
          principal_address?: Json | null
          purpose?: string | null
          registered_agent_address?: Json | null
          registered_agent_name?: string | null
          shares_authorized?: number | null
          status?: string
          type_specific_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      entity_filings: {
        Row: {
          effective_date: string | null
          entity_id: string
          fee_paid_cents: number | null
          filed_at: string
          filed_by_user_id: string | null
          filing_data: Json
          filing_type: string
          filing_year: number | null
          id: string
        }
        Insert: {
          effective_date?: string | null
          entity_id: string
          fee_paid_cents?: number | null
          filed_at?: string
          filed_by_user_id?: string | null
          filing_data?: Json
          filing_type: string
          filing_year?: number | null
          id?: string
        }
        Update: {
          effective_date?: string | null
          entity_id?: string
          fee_paid_cents?: number | null
          filed_at?: string
          filed_by_user_id?: string | null
          filing_data?: Json
          filing_type?: string
          filing_year?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_filings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_officers: {
        Row: {
          address: Json | null
          effective_from: string | null
          effective_to: string | null
          entity_id: string
          id: string
          name: string
          ownership_percent: number | null
          role: string
          shares_held: number | null
          title: string | null
        }
        Insert: {
          address?: Json | null
          effective_from?: string | null
          effective_to?: string | null
          entity_id: string
          id?: string
          name: string
          ownership_percent?: number | null
          role: string
          shares_held?: number | null
          title?: string | null
        }
        Update: {
          address?: Json | null
          effective_from?: string | null
          effective_to?: string | null
          entity_id?: string
          id?: string
          name?: string
          ownership_percent?: number | null
          role?: string
          shares_held?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_officers_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      filing_documents: {
        Row: {
          document_kind: string
          document_metadata: Json
          entity_id: string | null
          file_size_bytes: number | null
          filing_id: string
          generated_at: string
          id: string
          mime_type: string | null
          original_filename: string | null
          storage_path: string
        }
        Insert: {
          document_kind: string
          document_metadata?: Json
          entity_id?: string | null
          file_size_bytes?: number | null
          filing_id: string
          generated_at?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          storage_path: string
        }
        Update: {
          document_kind?: string
          document_metadata?: Json
          entity_id?: string | null
          file_size_bytes?: number | null
          filing_id?: string
          generated_at?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "filing_documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filing_documents_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "entity_filings"
            referencedColumns: ["id"]
          },
        ]
      }
      filing_sequences: {
        Row: {
          current_val: number
          prefix: string
        }
        Insert: {
          current_val?: number
          prefix: string
        }
        Update: {
          current_val?: number
          prefix?: string
        }
        Relationships: []
      }
      filing_sessions: {
        Row: {
          current_step: string
          entity_id: string | null
          filing_type: string
          form_data: Json
          id: string
          last_saved_at: string
          started_at: string
          status: string
          submitted_at: string | null
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          current_step?: string
          entity_id?: string | null
          filing_type: string
          form_data?: Json
          id?: string
          last_saved_at?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          current_step?: string
          entity_id?: string | null
          filing_type?: string
          form_data?: Json
          id?: string
          last_saved_at?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filing_sessions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string
          created_at: string
          display_name: string
          icon_path: string
          id: string
          jurisdiction: string
          module_url: string
          slug: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          display_name: string
          icon_path: string
          id?: string
          jurisdiction: string
          module_url: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string
          icon_path?: string
          id?: string
          jurisdiction?: string
          module_url?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      professor_courses: {
        Row: {
          course_id: string | null
          created_at: string
          custom_course_name: string | null
          id: string
          professor_id: string
          section_name: string | null
          status: string
          term: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          custom_course_name?: string | null
          id?: string
          professor_id: string
          section_name?: string | null
          status?: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          custom_course_name?: string | null
          id?: string
          professor_id?: string
          section_name?: string | null
          status?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_courses_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_profiles: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          approval_status: string
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          mobile_phone: string | null
          onboarding_status: string
          photo_path: string | null
          postal_code: string
          state: string
          title: string | null
          university_address_snapshot: Json
          university_id: string
          university_name_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          approval_status?: string
          city: string
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          mobile_phone?: string | null
          onboarding_status?: string
          photo_path?: string | null
          postal_code: string
          state: string
          title?: string | null
          university_address_snapshot: Json
          university_id: string
          university_name_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          approval_status?: string
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          mobile_phone?: string | null
          onboarding_status?: string
          photo_path?: string | null
          postal_code?: string
          state?: string
          title?: string | null
          university_address_snapshot?: Json
          university_id?: string
          university_name_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_project_library: {
        Row: {
          added_at: string
          launched_at: string | null
          professor_id: string
          project_id: string
          status: string
        }
        Insert: {
          added_at?: string
          launched_at?: string | null
          professor_id: string
          project_id: string
          status?: string
        }
        Update: {
          added_at?: string
          launched_at?: string | null
          professor_id?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_project_library_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_project_library_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          audience_tag: string
          file_size_bytes: number
          id: string
          label: string
          mime_type: string
          original_filename: string
          project_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          audience_tag: string
          file_size_bytes: number
          id?: string
          label: string
          mime_type: string
          original_filename: string
          project_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          audience_tag?: string
          file_size_bytes?: number
          id?: string
          label?: string
          mime_type?: string
          original_filename?: string
          project_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          area_of_law: string[]
          created_at: string
          creativity: boolean
          drafting: boolean
          duration: string
          id: string
          image_1_path: string | null
          image_2_path: string | null
          image_3_path: string | null
          oral_argument: boolean
          pitch: string
          popularity: number
          price: number
          professor_id: string
          real_world: boolean
          solo: boolean
          tagline: string
          team: boolean
          title: string
          usage_count: number
          versus: boolean
          world_rank_qualifying: boolean
        }
        Insert: {
          area_of_law?: string[]
          created_at?: string
          creativity?: boolean
          drafting?: boolean
          duration: string
          id?: string
          image_1_path?: string | null
          image_2_path?: string | null
          image_3_path?: string | null
          oral_argument?: boolean
          pitch: string
          popularity?: number
          price?: number
          professor_id: string
          real_world?: boolean
          solo?: boolean
          tagline: string
          team?: boolean
          title: string
          usage_count?: number
          versus?: boolean
          world_rank_qualifying?: boolean
        }
        Update: {
          area_of_law?: string[]
          created_at?: string
          creativity?: boolean
          drafting?: boolean
          duration?: string
          id?: string
          image_1_path?: string | null
          image_2_path?: string | null
          image_3_path?: string | null
          oral_argument?: boolean
          pitch?: string
          popularity?: number
          price?: number
          professor_id?: string
          real_world?: boolean
          solo?: boolean
          tagline?: string
          team?: boolean
          title?: string
          usage_count?: number
          versus?: boolean
          world_rank_qualifying?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "projects_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_submissions: {
        Row: {
          approve_token: string | null
          attribution: string
          id: string
          quote: string
          reject_token: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          submitted_by_user_id: string | null
          token_expires_at: string | null
        }
        Insert: {
          approve_token?: string | null
          attribution: string
          id?: string
          quote: string
          reject_token?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          submitted_by_user_id?: string | null
          token_expires_at?: string | null
        }
        Update: {
          approve_token?: string | null
          attribution?: string
          id?: string
          quote?: string
          reject_token?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          submitted_by_user_id?: string | null
          token_expires_at?: string | null
        }
        Relationships: []
      }
      roster_entries: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          full_name_raw: string
          id: string
          last_name: string
          middle_name: string | null
          roster_id: string
          status: string
          student_id_external: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          full_name_raw: string
          id?: string
          last_name: string
          middle_name?: string | null
          roster_id: string
          status?: string
          student_id_external?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          full_name_raw?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          roster_id?: string
          status?: string
          student_id_external?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_entries_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_matches: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          match_reason: string | null
          match_status: string
          matched_by: string
          professor_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          roster_entry_id: string
          school_id: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_reason?: string | null
          match_status: string
          matched_by?: string
          professor_id: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          roster_entry_id: string
          school_id: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_reason?: string | null
          match_status?: string
          matched_by?: string
          professor_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          roster_entry_id?: string
          school_id?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_matches_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_matches_roster_entry_id_fkey"
            columns: ["roster_entry_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_matches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_matches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          course_id: string
          created_at: string
          id: string
          professor_course_id: string | null
          professor_id: string
          roster_name: string
          school_id: string
          section_name: string | null
          status: string
          term: string | null
          updated_at: string
          upload_source: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          professor_course_id?: string | null
          professor_id: string
          roster_name: string
          school_id: string
          section_name?: string | null
          status?: string
          term?: string | null
          updated_at?: string
          upload_source: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          professor_course_id?: string | null
          professor_id?: string
          roster_name?: string
          school_id?: string
          section_name?: string | null
          status?: string
          term?: string | null
          updated_at?: string
          upload_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_professor_course_id_fkey"
            columns: ["professor_course_id"]
            isOneToOne: false
            referencedRelation: "professor_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          admin_contact_email: string | null
          admin_contact_name: string | null
          approved_at: string | null
          approved_by_admin_id: string | null
          city: string
          country: string
          created_at: string
          created_by_user_id: string | null
          domains: Json
          id: string
          name: string
          normalized_name: string
          postal_code: string
          state: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          admin_contact_email?: string | null
          admin_contact_name?: string | null
          approved_at?: string | null
          approved_by_admin_id?: string | null
          city: string
          country: string
          created_at?: string
          created_by_user_id?: string | null
          domains?: Json
          id?: string
          name: string
          normalized_name: string
          postal_code: string
          state: string
          status: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          admin_contact_email?: string | null
          admin_contact_name?: string | null
          approved_at?: string | null
          approved_by_admin_id?: string | null
          city?: string
          country?: string
          created_at?: string
          created_by_user_id?: string | null
          domains?: Json
          id?: string
          name?: string
          normalized_name?: string
          postal_code?: string
          state?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      student_professor_links: {
        Row: {
          created_at: string
          id: string
          professor_id: string
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          professor_id: string
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          professor_id?: string
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_professor_links_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_professor_links_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_professor_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          additional_emails: Json
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          enrollment_status: string | null
          first_name: string
          id: string
          last_name: string
          law_school_year: string | null
          middle_name: string | null
          mobile_phone: string
          onboarding_status: string
          postal_code: string
          preferred_name: string | null
          profile_photo_url: string | null
          state: string
          title: string | null
          undergraduate_institution: string | null
          university_address_snapshot: Json
          university_email: string
          university_id: string
          university_name_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_emails?: Json
          address_line_1: string
          address_line_2?: string | null
          city: string
          country: string
          created_at?: string
          enrollment_status?: string | null
          first_name: string
          id?: string
          last_name: string
          law_school_year?: string | null
          middle_name?: string | null
          mobile_phone: string
          onboarding_status?: string
          postal_code: string
          preferred_name?: string | null
          profile_photo_url?: string | null
          state: string
          title?: string | null
          undergraduate_institution?: string | null
          university_address_snapshot: Json
          university_email: string
          university_id: string
          university_name_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_emails?: Json
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          enrollment_status?: string | null
          first_name?: string
          id?: string
          last_name?: string
          law_school_year?: string | null
          middle_name?: string | null
          mobile_phone?: string
          onboarding_status?: string
          postal_code?: string
          preferred_name?: string | null
          profile_photo_url?: string | null
          state?: string
          title?: string | null
          undergraduate_institution?: string | null
          university_address_snapshot?: Json
          university_email?: string
          university_id?: string
          university_name_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_llc_entity: {
        Args: { p_form: Json; p_user_id: string }
        Returns: Json
      }
      create_profit_corp_entity: {
        Args: { p_form: Json; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
