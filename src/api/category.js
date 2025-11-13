import request from '@/utils/request'

/**
 * 获取分类树
 */
export function getCategoryTree() {
  return request({
    url: '/category/tree',
    method: 'get'
  })
}

/**
 * 获取一级分类列表
 */
export function getFirstLevelCategories() {
  return request({
    url: '/category/first-level',
    method: 'get'
  })
}

/**
 * 根据父分类ID获取子分类
 */
export function getCategoriesByParentId(parentId) {
  return request({
    url: `/category/children/${parentId}`,
    method: 'get'
  })
}