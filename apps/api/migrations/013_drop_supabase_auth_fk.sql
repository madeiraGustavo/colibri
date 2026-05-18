-- ============================================================
-- Migration 013: Remove legacy Supabase Auth FK from users table
--
-- A tabela public.users tinha uma FK (users_id_fkey) que referenciava
-- auth.users(id) do Supabase Auth. Isso impedia a criação de usuários
-- diretamente pela API Fastify (que agora gerencia autenticação própria).
--
-- Mudanças:
-- 1. Remove FK users_id_fkey (public.users.id → auth.users.id)
--
-- Segurança:
-- - Nenhum dado é perdido ou alterado
-- - Apenas remove a constraint que impedia registros via API
-- - Rollback: ALTER TABLE public.users ADD CONSTRAINT users_id_fkey
--     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ============================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
