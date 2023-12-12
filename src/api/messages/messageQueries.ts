export const MessageQueries = {
  getMessageBySlug: `
  SELECT 
    slug, 
    title, 
    message, 
    redirect_url as 'redirectURL', 
    type 
  FROM dynamic_messages
  WHERE slug = ?`
}
