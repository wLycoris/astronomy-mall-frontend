import request from '@/utils/request'

/**
 * 后台分类管理 API
 *
 * 接口列表：
 *   getCategoryTree   GET    /api/admin/category/tree          - 分类树（含商品数量）
 *   addCategory       POST   /api/admin/category/add           - 新增分类
 *   updateCategory    PUT    /api/admin/category/update/:id    - 编辑分类
 *   deleteCategory    DELETE /api/admin/category/delete/:id    - 删除分类
 *   sortCategories    POST   /api/admin/category/sort          - 批量排序
 */

/**
 * 获取分类树
 * 返回树形结构，一级分类下包含 children（二级分类）
 * 每个节点包含 productCount 字段（关联商品数）
 */
export function getCategoryTree() {
    return request({
        url: '/admin/category/tree',
        method: 'get'
    })
}

/**
 * 新增分类
 * @param {Object} data
 * @param {string} data.categoryName  - 分类名称（必填）
 * @param {number} data.parentId      - 父分类ID（0=一级分类）（必填）
 * @param {string} [data.icon]        - 图标URL
 * @param {number} [data.sort]        - 排序值（越大越靠前）
 * @param {string} [data.description] - 描述
 * @param {number} [data.isShow]      - 是否显示（0-隐藏 1-显示）
 */
export function addCategory(data) {
    return request({
        url: '/admin/category/add',
        method: 'post',
        data
    })
}

/**
 * 编辑分类
 * @param {number} id  - 分类ID
 * @param {Object} data - 同 addCategory 的字段（parentId 传入但后端不会修改）
 */
export function updateCategory(id, data) {
    return request({
        url: `/admin/category/update/${id}`,
        method: 'put',
        data
    })
}

/**
 * 删除分类
 * 📌 有关联商品时后端会返回错误，需前端提示
 * @param {number} id - 分类ID
 */
export function deleteCategory(id) {
    return request({
        url: `/admin/category/delete/${id}`,
        method: 'delete'
    })
}

/**
 * 批量排序
 * @param {Array} items - [{ id: 1, sort: 10 }, { id: 2, sort: 5 }, ...]
 */
export function sortCategories(items) {
    return request({
        url: '/admin/category/sort',
        method: 'post',
        data: { items }
    })
}