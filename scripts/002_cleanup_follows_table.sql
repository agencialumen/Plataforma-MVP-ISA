-- Script para limpar completamente a tabela follows e suas referências
-- Remove todas as referências à funcionalidade de seguir

-- Remover todas as constraints relacionadas à tabela follows
ALTER TABLE public.follows 
  DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;

ALTER TABLE public.follows 
  DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- Deletar todos os dados da tabela follows
DELETE FROM public.follows;

-- Remover a tabela follows completamente
DROP TABLE IF EXISTS public.follows;

-- Remover notificações relacionadas a follows
DELETE FROM public.notifications 
WHERE type = 'follow';

-- Limpar campos followers e following dos perfis de usuário
UPDATE public.users 
SET followers = 0, following = 0 
WHERE followers IS NOT NULL OR following IS NOT NULL;

-- Remover colunas followers e following se existirem
ALTER TABLE public.users 
  DROP COLUMN IF EXISTS followers,
  DROP COLUMN IF EXISTS following;

-- Limpar dados relacionados no Firebase (será feito via aplicação)
-- Este script remove apenas as estruturas do banco SQL
