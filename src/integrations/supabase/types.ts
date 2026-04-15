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
  public: {
    Tables: {
      academy_modules: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nivel_requerido: number
          orden: number
          tipo: Database["public"]["Enums"]["module_tipo_enum"]
          titulo: string
          xp_otorga: number
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_requerido?: number
          orden?: number
          tipo?: Database["public"]["Enums"]["module_tipo_enum"]
          titulo: string
          xp_otorga?: number
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_requerido?: number
          orden?: number
          tipo?: Database["public"]["Enums"]["module_tipo_enum"]
          titulo?: string
          xp_otorga?: number
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_online: boolean
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_online?: boolean
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_online?: boolean
          name?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criterio: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          xp_otorga: number
        }
        Insert: {
          created_at?: string
          criterio?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          xp_otorga?: number
        }
        Update: {
          created_at?: string
          criterio?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          xp_otorga?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          odoo_client_id: string | null
          phone: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          odoo_client_id?: string | null
          phone?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          odoo_client_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          channel: Database["public"]["Enums"]["conversation_channel"]
          company_id: string
          contact_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          channel?: Database["public"]["Enums"]["conversation_channel"]
          company_id: string
          contact_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          channel?: Database["public"]["Enums"]["conversation_channel"]
          company_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_job_technicians: {
        Row: {
          assigned_at: string
          id: string
          job_id: string
          technician_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          job_id: string
          technician_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          job_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_job_technicians_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_job_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_jobs: {
        Row: {
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          crew_id: string | null
          customer_name: string
          customer_status: Database["public"]["Enums"]["dispatch_customer_status"]
          estimated_duration_minutes: number | null
          id: string
          job_number: string
          notes: string | null
          odoo_order_id: string | null
          priority: string
          project_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: Database["public"]["Enums"]["dispatch_service_type"]
          site_address: string
          status: Database["public"]["Enums"]["dispatch_job_status"]
          territory: string | null
          updated_at: string
          visit_type: Database["public"]["Enums"]["dispatch_visit_type"]
          work_order_id: string | null
          zone: string | null
        }
        Insert: {
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          crew_id?: string | null
          customer_name: string
          customer_status?: Database["public"]["Enums"]["dispatch_customer_status"]
          estimated_duration_minutes?: number | null
          id?: string
          job_number?: string
          notes?: string | null
          odoo_order_id?: string | null
          priority?: string
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: Database["public"]["Enums"]["dispatch_service_type"]
          site_address: string
          status?: Database["public"]["Enums"]["dispatch_job_status"]
          territory?: string | null
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["dispatch_visit_type"]
          work_order_id?: string | null
          zone?: string | null
        }
        Update: {
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          crew_id?: string | null
          customer_name?: string
          customer_status?: Database["public"]["Enums"]["dispatch_customer_status"]
          estimated_duration_minutes?: number | null
          id?: string
          job_number?: string
          notes?: string | null
          odoo_order_id?: string | null
          priority?: string
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: Database["public"]["Enums"]["dispatch_service_type"]
          site_address?: string
          status?: Database["public"]["Enums"]["dispatch_job_status"]
          territory?: string | null
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["dispatch_visit_type"]
          work_order_id?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      dispatch_notes: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          job_id: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          job_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_status_history: {
        Row: {
          changed_by_name: string | null
          created_at: string
          id: string
          job_id: string
          new_status: Database["public"]["Enums"]["dispatch_job_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["dispatch_job_status"] | null
        }
        Insert: {
          changed_by_name?: string | null
          created_at?: string
          id?: string
          job_id: string
          new_status: Database["public"]["Enums"]["dispatch_job_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["dispatch_job_status"] | null
        }
        Update: {
          changed_by_name?: string | null
          created_at?: string
          id?: string
          job_id?: string
          new_status?: Database["public"]["Enums"]["dispatch_job_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["dispatch_job_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_tickets: {
        Row: {
          city: string
          created_at: string
          description: string
          host_ip: string | null
          host_name: string | null
          id: string
          isp: string | null
          notes: string | null
          priority: string
          resolved_at: string | null
          site: string | null
          source: string
          status: string
          technician_id: string | null
          technician_name: string | null
          tenant_id: string | null
          tenant_type: string | null
          ticket_number: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          city: string
          created_at?: string
          description: string
          host_ip?: string | null
          host_name?: string | null
          id?: string
          isp?: string | null
          notes?: string | null
          priority?: string
          resolved_at?: string | null
          site?: string | null
          source?: string
          status?: string
          technician_id?: string | null
          technician_name?: string | null
          tenant_id?: string | null
          tenant_type?: string | null
          ticket_number?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          host_ip?: string | null
          host_name?: string | null
          id?: string
          isp?: string | null
          notes?: string | null
          priority?: string
          resolved_at?: string | null
          site?: string | null
          source?: string
          status?: string
          technician_id?: string | null
          technician_name?: string | null
          tenant_id?: string | null
          tenant_type?: string | null
          ticket_number?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: string
          explicacion: string | null
          id: string
          opciones: Json
          pregunta: string
          respuesta_correcta: number
        }
        Insert: {
          exam_id: string
          explicacion?: string | null
          id?: string
          opciones?: Json
          pregunta: string
          respuesta_correcta?: number
        }
        Update: {
          exam_id?: string
          explicacion?: string | null
          id?: string
          opciones?: Json
          pregunta?: string
          respuesta_correcta?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          calificacion_minima: number
          created_at: string
          id: string
          max_intentos: number
          module_id: string | null
          titulo: string
          xp_primer_intento: number
          xp_reintento: number
        }
        Insert: {
          calificacion_minima?: number
          created_at?: string
          id?: string
          max_intentos?: number
          module_id?: string | null
          titulo: string
          xp_primer_intento?: number
          xp_reintento?: number
        }
        Update: {
          calificacion_minima?: number
          created_at?: string
          id?: string
          max_intentos?: number
          module_id?: string | null
          titulo?: string
          xp_primer_intento?: number
          xp_reintento?: number
        }
        Relationships: [
          {
            foreignKeyName: "exams_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_enum"]
          technician_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_enum"]
          technician_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_enum"]
          technician_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_badges: {
        Row: {
          badge_id: string
          fecha_obtenido: string
          id: string
          technician_id: string
        }
        Insert: {
          badge_id: string
          fecha_obtenido?: string
          id?: string
          technician_id: string
        }
        Update: {
          badge_id?: string
          fecha_obtenido?: string
          id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_badges_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_exam_attempts: {
        Row: {
          aprobado: boolean
          calificacion: number
          exam_id: string
          fecha: string
          id: string
          intento_num: number
          technician_id: string
        }
        Insert: {
          aprobado?: boolean
          calificacion?: number
          exam_id: string
          fecha?: string
          id?: string
          intento_num?: number
          technician_id: string
        }
        Update: {
          aprobado?: boolean
          calificacion?: number
          exam_id?: string
          fecha?: string
          id?: string
          intento_num?: number
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_exam_attempts_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_progress: {
        Row: {
          completado: boolean
          fecha_completado: string | null
          id: string
          module_id: string
          technician_id: string
          xp_ganado: number
        }
        Insert: {
          completado?: boolean
          fecha_completado?: string | null
          id?: string
          module_id: string
          technician_id: string
          xp_ganado?: number
        }
        Update: {
          completado?: boolean
          fecha_completado?: string | null
          id?: string
          module_id?: string
          technician_id?: string
          xp_ganado?: number
        }
        Relationships: [
          {
            foreignKeyName: "technician_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_progress_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          nivel: number | null
          phone: string | null
          plaza: Database["public"]["Enums"]["plaza_enum"] | null
          racha_meses_limpios: number | null
          speciality: string | null
          xp_mes_actual: number | null
          xp_total: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          nivel?: number | null
          phone?: string | null
          plaza?: Database["public"]["Enums"]["plaza_enum"] | null
          racha_meses_limpios?: number | null
          speciality?: string | null
          xp_mes_actual?: number | null
          xp_total?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          nivel?: number | null
          phone?: string | null
          plaza?: Database["public"]["Enums"]["plaza_enum"] | null
          racha_meses_limpios?: number | null
          speciality?: string | null
          xp_mes_actual?: number | null
          xp_total?: number | null
        }
        Relationships: []
      }
      xp_log: {
        Row: {
          created_at: string
          id: string
          puntos: number
          referencia_id: string | null
          technician_id: string
          tipo: Database["public"]["Enums"]["xp_tipo_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          puntos: number
          referencia_id?: string | null
          technician_id: string
          tipo: Database["public"]["Enums"]["xp_tipo_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          puntos?: number
          referencia_id?: string | null
          technician_id?: string
          tipo?: Database["public"]["Enums"]["xp_tipo_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "xp_log_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_xp_mes: { Args: { p_technician_id: string }; Returns: Json }
      is_supervisor: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      conversation_channel: "whatsapp" | "call" | "ticket"
      conversation_status:
        | "bot_active"
        | "escalated"
        | "in_progress"
        | "resolved"
      dispatch_customer_status:
        | "pending"
        | "confirmed"
        | "unavailable"
        | "access_denied"
        | "reschedule"
      dispatch_job_status:
        | "pending_dispatch"
        | "scheduled"
        | "in_route"
        | "on_site"
        | "completed"
        | "blocked"
      dispatch_service_type:
        | "instalacion_residencial"
        | "instalacion_empresarial"
        | "mantenimiento"
        | "reparacion"
        | "retiro"
        | "migracion"
        | "otro"
      dispatch_visit_type:
        | "primera_visita"
        | "seguimiento"
        | "revisita"
        | "emergencia"
      message_sender_type: "bot" | "client" | "agent"
      module_tipo_enum: "video" | "documento" | "practica"
      plaza_enum:
        | "nuevo_leon"
        | "coahuila"
        | "tamaulipas"
        | "queretaro"
        | "jalisco"
        | "cdmx"
      user_role_enum: "technician" | "supervisor"
      xp_tipo_enum:
        | "ticket_ok"
        | "ticket_anticipado"
        | "ticket_critico"
        | "instalacion"
        | "instalacion_empresa"
        | "modulo"
        | "examen_1er"
        | "examen_reintento"
        | "sop"
        | "racha_30d"
        | "badge"
        | "mentoria"
        | "revisita"
        | "sla_fail"
        | "ticket_sin_evidencia"
        | "instalacion_falla"
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
  public: {
    Enums: {
      conversation_channel: ["whatsapp", "call", "ticket"],
      conversation_status: [
        "bot_active",
        "escalated",
        "in_progress",
        "resolved",
      ],
      dispatch_customer_status: [
        "pending",
        "confirmed",
        "unavailable",
        "access_denied",
        "reschedule",
      ],
      dispatch_job_status: [
        "pending_dispatch",
        "scheduled",
        "in_route",
        "on_site",
        "completed",
        "blocked",
      ],
      dispatch_service_type: [
        "instalacion_residencial",
        "instalacion_empresarial",
        "mantenimiento",
        "reparacion",
        "retiro",
        "migracion",
        "otro",
      ],
      dispatch_visit_type: [
        "primera_visita",
        "seguimiento",
        "revisita",
        "emergencia",
      ],
      message_sender_type: ["bot", "client", "agent"],
      module_tipo_enum: ["video", "documento", "practica"],
      plaza_enum: [
        "nuevo_leon",
        "coahuila",
        "tamaulipas",
        "queretaro",
        "jalisco",
        "cdmx",
      ],
      user_role_enum: ["technician", "supervisor"],
      xp_tipo_enum: [
        "ticket_ok",
        "ticket_anticipado",
        "ticket_critico",
        "instalacion",
        "instalacion_empresa",
        "modulo",
        "examen_1er",
        "examen_reintento",
        "sop",
        "racha_30d",
        "badge",
        "mentoria",
        "revisita",
        "sla_fail",
        "ticket_sin_evidencia",
        "instalacion_falla",
      ],
    },
  },
} as const
