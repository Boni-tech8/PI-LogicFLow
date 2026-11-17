// Aceita o prisma normal ou um client de transação
export function notify(db, userId, type, title, body, data = null) {
  return db.notification.create({ data: { userId, type, title, body, data } });
}

export function notifyMany(db, userIds, type, title, body, data = null) {
  if (!userIds.length) return Promise.resolve();
  return db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body, data })),
  });
}
