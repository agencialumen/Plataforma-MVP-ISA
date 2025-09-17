-- Script para deletar especificamente notificações de seguir do Firebase
-- Este script remove notificações que contenham mensagens relacionadas a seguir

-- Deletar notificações do tipo 'follow'
DELETE FROM notifications 
WHERE type = 'follow';

-- Deletar notificações que contenham texto relacionado a seguir
DELETE FROM notifications 
WHERE message LIKE '%começou a te seguir%' 
   OR message LIKE '%started following%'
   OR message LIKE '%seguindo você%'
   OR message LIKE '%following you%';

-- Limpar notificações órfãs ou com tipos inválidos
DELETE FROM notifications 
WHERE type IS NULL 
   OR type = '';
