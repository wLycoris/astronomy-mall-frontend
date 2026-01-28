/**
 * 📌 管理员-商品管理 API
 * 路径: src/api/admin/product.js
 */

import request from '@/utils/request'

/**
 * 1. 商品列表查询 (分页/搜索/筛选)
 */
export function getProductList(params) {
    return request({
        url: '/admin/product/list',
        method: 'get',
        params
    })
}

/**
 * 2. 商品详情查询
 */
export function getProductDetail(id) {
    return request({
        url: `/admin/product/detail/${id}`,
        method: 'get'
    })
}

/**
 * 3. 新增商品
 */
export function addProduct(data) {
    return request({
        url: '/admin/product/add',
        method: 'post',
        data
    })
}

/**
 * 4. 编辑商品
 */
export function updateProduct(id, data) {
    return request({
        url: `/admin/product/update/${id}`,
        method: 'put',
        data
    })
}

/**
 * 5. 商品上下架 (批量)
 */
export function updateProductStatus(data) {
    return request({
        url: '/admin/product/status',
        method: 'post',
        data
    })
}

/**
 * 6. 库存调整
 */
export function adjustStock(id, data) {
    return request({
        url: `/admin/product/stock/${id}`,
        method: 'put',
        data
    })
}

/**
 * 7. 删除商品
 */
export function deleteProduct(id) {
    return request({
        url: `/admin/product/delete/${id}`,
        method: 'delete'
    })
}

/**
 * 8. 库存预警列表
 */
export function getStockWarning() {
    return request({
        url: '/admin/product/stock-warning',
        method: 'get'
    })
}
/**
 * 批量导入商品
 */
export function importProducts(formData) {
    return request({
        url: '/admin/product/import',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data: formData
    })
}

/**
 * 批量导出商品
 */
export function exportProducts(params) {
    return request({
        url: '/admin/product/export',
        method: 'get',
        params,
        responseType: 'blob'  // 重要: 二进制流
    }).then(response => {
        // 创建下载链接
        const blob = new Blob([response], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `商品列表_${Date.now()}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
    })
}

/**
 * 下载导入模板
 */
export function downloadTemplate() {
    return request({
        url: '/admin/product/download-template',
        method: 'get',
        responseType: 'blob'
    }).then(blob => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '商品导入模板.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
    })
}
