export function getPageSql({ limit, page, tableName }: Db.PageUtilParams) {
  if (!page || page < 1) {
    page = 1
  }
  const list = await this.sqlite.all<Db.ErrorItem[]>(
    `SELECT * FROM ${tableName} ORDER BY createdTime DESC LIMIT ${limit} OFFSET ${limit *
      (page - 1)};`
  )
  const countKey = `COUNT(*)`
  const count = await this.sqlite.get(`SELECT ${countKey} FROM ${tableName};`)
  return {
    limit,
    page,
    total: count[countKey],
    list
  }
}
