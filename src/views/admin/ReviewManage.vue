<template>
  <div class="review-manage">
    <section class="commerce-hero review-hero">
      <div class="hero-copy">
        <span class="hero-kicker">REVIEW OPERATIONS</span>
        <h2>评价管理</h2>
        <p>审核评价内容、维护商家回复与置顶状态，让商品口碑展示更可信。</p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span>评价总量</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="metric-card warning">
          <span>本页待审核</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div class="metric-card">
          <span>本页置顶</span>
          <strong>{{ topCount }}</strong>
        </div>
      </div>
    </section>

    <!-- ====================================================== -->
    <!-- 筛选栏                                                  -->
    <!-- ====================================================== -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryForm" inline>

        <!-- 【修复】新增：按商品名称搜索 -->
        <el-form-item label="商品名称">
          <el-input
              v-model="queryForm.productName"
              placeholder="输入商品名称"
              clearable
              style="width:160px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="评价状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常"   :value="1" />
            <el-option label="待审核" :value="2" />
            <el-option label="已删除" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="评分">
          <el-select v-model="queryForm.rating" placeholder="全部" clearable style="width:100px">
            <el-option v-for="n in 5" :key="n" :label="`${n}星`" :value="n" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
              v-model="queryForm.keyword"
              placeholder="搜索评价内容"
              clearable
              style="width:160px"
              @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:220px"
          />
        </el-form-item>

        <!-- 【修复】只看置顶：从 checkbox(boolean) 改为 el-switch，传值 1/null -->
        <el-form-item label="只看置顶">
          <el-switch
              v-model="queryForm.isTop"
              :active-value="1"
              :inactive-value="null"
              @change="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ====================================================== -->
    <!-- 评价列表表格                                            -->
    <!-- ====================================================== -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div>
          <span class="card-title">评价列表</span>
          <small>关注待审核、置顶和需要商家回复的评价</small>
        </div>
        <div class="stats">
          <el-tag type="info">共 {{ total }} 条评价</el-tag>
          <el-tag type="warning" class="ml-8" v-if="pendingCount > 0">
            待审核 {{ pendingCount }} 条
          </el-tag>
        </div>
      </div>

      <el-table
          v-loading="loading"
          :data="reviewList"
          border
          stripe
          style="width:100%"
      >
        <el-table-column label="ID" prop="id" width="70" align="center" />

        <!-- 商品信息 -->
        <el-table-column label="商品" width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                  :src="row.productImage"
                  style="width:40px;height:40px;border-radius:4px;flex-shrink:0"
                  fit="cover"
              />
              <span class="product-name">{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 用户信息 -->
        <el-table-column label="用户" width="130">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :src="row.userAvatar" :size="28" />
              <span class="ml-6">
                {{ row.isAnonymous === 1 ? '匿名用户' : (row.userNickname || '用户' + row.userId) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 评分 -->
        <el-table-column label="评分" width="130" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled />
          </template>
        </el-table-column>

        <!-- 评价内容 -->
        <el-table-column label="评价内容" min-width="200">
          <template #default="{ row }">
            <div class="content-cell">
              <el-tag v-if="row.isTop === 1" type="danger" size="small" class="mr-4">置顶</el-tag>
              <span class="content-text">{{ row.content || '（无文字评价）' }}</span>
            </div>
            <div v-if="row.images" class="image-preview">
              <el-image
                  v-for="(img, idx) in parseImages(row.images)"
                  :key="idx"
                  :src="img"
                  :preview-src-list="parseImages(row.images)"
                  style="width:32px;height:32px;border-radius:2px;margin-right:4px"
                  fit="cover"
              />
            </div>
            <!-- 【修复】回复显示：reply 为 null 时 non_null 配置会过滤，
                 后端 VO 已加 @JsonInclude(ALWAYS)，这里用 row.reply != null 更健壮 -->
            <div v-if="row.reply != null && row.reply !== ''" class="reply-preview">
              <el-icon size="12"><ChatLineRound /></el-icon>
              <span>商家回复：{{ row.reply }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="点赞" prop="likeCount" width="70" align="center" />

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" prop="createTime" width="160" />

        <!-- 操作列 -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
                type="success" link size="small"
                :disabled="row.status === 0"
                @click="handleReply(row)"
            >
              <!-- 【修复】回复按钮文字判断也用 != null -->
              {{ (row.reply != null && row.reply !== '') ? '修改回复' : '回复' }}
            </el-button>
            <template v-if="row.status === 2">
              <el-button type="warning" link size="small" @click="handleAudit(row, 1)">通过</el-button>
              <el-button type="danger"  link size="small" @click="handleAudit(row, 0)">拒绝</el-button>
            </template>
            <el-button
                v-if="row.status === 1"
                :type="row.isTop === 1 ? 'warning' : 'info'"
                link size="small"
                @click="handleToggleTop(row)"
            >
              {{ row.isTop === 1 ? '取消置顶' : '置顶' }}
            </el-button>
            <el-popconfirm
                title="确定删除该评价吗？"
                @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small" :disabled="row.status === 0">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
            v-model:current-page="queryForm.pageNum"
            v-model:page-size="queryForm.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadReviewList"
            @current-change="loadReviewList"
        />
      </div>
    </el-card>

    <!-- ====================================================== -->
    <!-- 评价详情弹窗                                            -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="detailVisible"
        title="评价详情"
        width="680px"
        destroy-on-close
        append-to-body
    >
      <div v-if="currentReview" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评价ID">{{ currentReview.id }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ currentReview.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="商品">{{ currentReview.productName }}</el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ currentReview.isAnonymous === 1 ? '匿名用户' : currentReview.userNickname }}
          </el-descriptions-item>
          <el-descriptions-item label="评分">
            <el-rate v-model="currentReview.rating" disabled />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentReview.status)">
              {{ statusLabel(currentReview.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentReview.createTime }}</el-descriptions-item>
          <el-descriptions-item label="点赞数">{{ currentReview.likeCount }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-title">评价内容</div>
          <p class="review-content">{{ currentReview.content || '（无文字评价）' }}</p>
        </div>

        <div v-if="currentReview.images" class="detail-section">
          <div class="section-title">评价图片</div>
          <div class="image-list">
            <el-image
                v-for="(img, idx) in parseImages(currentReview.images)"
                :key="idx"
                :src="img"
                :preview-src-list="parseImages(currentReview.images)"
                style="width:80px;height:80px;border-radius:4px;margin-right:8px"
                fit="cover"
            />
          </div>
        </div>

        <!-- 【修复】详情弹窗中的回复显示也用 != null 判断 -->
        <div v-if="currentReview.reply != null && currentReview.reply !== ''" class="detail-section">
          <div class="section-title">商家回复</div>
          <div class="reply-box">
            <p>{{ currentReview.reply }}</p>
            <p class="reply-time">回复时间：{{ currentReview.replyTime }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="success" @click="handleReply(currentReview)">
          {{ (currentReview?.reply != null && currentReview?.reply !== '') ? '修改回复' : '回复评价' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ====================================================== -->
    <!-- 回复评价弹窗                                            -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="replyVisible"
        :title="(replyForm.existingReply != null && replyForm.existingReply !== '') ? '修改商家回复' : '回复评价'"
        width="500px"
        destroy-on-close
        append-to-body
    >
      <div class="original-review" v-if="replyForm.originalContent">
        <div class="section-title">用户评价</div>
        <el-rate :model-value="replyForm.originalRating" disabled size="small" />
        <p>{{ replyForm.originalContent }}</p>
      </div>

      <div class="existing-reply" v-if="replyForm.existingReply != null && replyForm.existingReply !== ''">
        <div class="section-title">当前回复</div>
        <div class="reply-box">{{ replyForm.existingReply }}</div>
      </div>

      <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-position="top">
        <el-form-item
            :label="(replyForm.existingReply != null && replyForm.existingReply !== '') ? '新回复内容' : '回复内容'"
            prop="reply"
        >
          <el-input
              v-model="replyForm.reply"
              type="textarea"
              :rows="4"
              :maxlength="500"
              show-word-limit
              placeholder="请输入回复内容（最多500字）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="submitReply">
          确认回复
        </el-button>
      </template>
    </el-dialog>

    <!-- ====================================================== -->
    <!-- 审核评价弹窗                                            -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="auditVisible"
        :title="auditForm.action === 1 ? '审核通过确认' : '审核拒绝确认'"
        width="460px"
        append-to-body
    >
      <p v-if="auditForm.action === 1">
        确定审核通过该评价吗？通过后该评价将在商品页面正常显示。
      </p>
      <p v-else>确定拒绝（删除）该评价吗？</p>

      <el-form label-position="top">
        <el-form-item label="审核备注（可选）">
          <el-input
              v-model="auditForm.remark"
              type="textarea"
              :rows="3"
              placeholder="可填写审核备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button
            :type="auditForm.action === 1 ? 'success' : 'danger'"
            :loading="auditLoading"
            @click="submitAudit"
        >
          确认{{ auditForm.action === 1 ? '通过' : '拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ChatLineRound } from '@element-plus/icons-vue'
import {
  getReviewList,
  replyReview,
  auditReview,
  toggleTopReview,
  deleteReview
} from '@/api/admin/review'

// ============================================================
// 列表查询
// ============================================================
const loading    = ref(false)
const reviewList = ref([])
const total      = ref(0)
const dateRange  = ref(null)

const queryForm = reactive({
  pageNum:     1,
  pageSize:    10,
  productName: '',   // 【新增】商品名称模糊搜索
  status:      null,
  rating:      null,
  keyword:     '',
  isTop:       null, // 【修复】Integer: 1=只看置顶, null=全部
  startTime:   '',
  endTime:     ''
})

const pendingCount = computed(() => reviewList.value.filter(r => r.status === 2).length)
const topCount = computed(() => reviewList.value.filter(r => r.isTop === 1).length)

const loadReviewList = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryForm.startTime = dateRange.value[0]
      queryForm.endTime   = dateRange.value[1]
    } else {
      queryForm.startTime = ''
      queryForm.endTime   = ''
    }

    const res = await getReviewList({ ...queryForm })
    reviewList.value = res.data.records || []
    total.value      = res.data.total   || 0
  } catch (e) {
    ElMessage.error('获取评价列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.pageNum = 1
  loadReviewList()
}

const handleReset = () => {
  queryForm.productName = ''
  queryForm.status      = null
  queryForm.rating      = null
  queryForm.keyword     = ''
  queryForm.isTop       = null  // 【修复】重置为 null
  queryForm.startTime   = ''
  queryForm.endTime     = ''
  dateRange.value       = null
  handleSearch()
}

onMounted(() => loadReviewList())

// ============================================================
// 工具方法
// ============================================================
const parseImages = (images) => {
  if (!images) return []
  try { return JSON.parse(images) } catch { return [] }
}

const statusLabel = (status) => {
  const map = { 0: '已删除', 1: '正常', 2: '待审核' }
  return map[status] ?? '未知'
}

const statusTagType = (status) => {
  const map = { 0: 'danger', 1: 'success', 2: 'warning' }
  return map[status] ?? 'info'
}

// ============================================================
// 详情弹窗
// ============================================================
const detailVisible = ref(false)
const currentReview = ref(null)

const handleDetail = (row) => {
  currentReview.value = { ...row }
  detailVisible.value = true
}

// ============================================================
// 回复弹窗
// ============================================================
const replyVisible  = ref(false)
const replyLoading  = ref(false)
const replyFormRef  = ref(null)

const replyForm = reactive({
  reviewId:        null,
  reply:           '',
  existingReply:   null,
  originalContent: '',
  originalRating:  0
})

const replyRules = {
  reply: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

const handleReply = (row) => {
  detailVisible.value = false

  replyForm.reviewId        = row.id
  replyForm.reply           = row.reply || ''
  replyForm.existingReply   = row.reply  // 【修复】直接存原值，null 也保留
  replyForm.originalContent = row.content
  replyForm.originalRating  = row.rating
  replyVisible.value        = true
}

const submitReply = async () => {
  await replyFormRef.value.validate()
  replyLoading.value = true
  try {
    await replyReview(replyForm.reviewId, { reply: replyForm.reply })
    ElMessage.success('回复成功')
    replyVisible.value = false
    loadReviewList()
  } catch (e) {
    ElMessage.error('回复失败，请重试')
  } finally {
    replyLoading.value = false
  }
}

// ============================================================
// 审核弹窗
// ============================================================
const auditVisible = ref(false)
const auditLoading = ref(false)

const auditForm = reactive({
  reviewId: null,
  action:   1,
  remark:   ''
})

const handleAudit = (row, action) => {
  auditForm.reviewId = row.id
  auditForm.action   = action
  auditForm.remark   = ''
  auditVisible.value = true
}

const submitAudit = async () => {
  auditLoading.value = true
  try {
    await auditReview(auditForm.reviewId, {
      action: auditForm.action,
      remark: auditForm.remark
    })
    ElMessage.success(auditForm.action === 1 ? '审核通过' : '已拒绝并删除')
    auditVisible.value = false
    loadReviewList()
  } catch (e) {
    ElMessage.error('审核操作失败，请重试')
  } finally {
    auditLoading.value = false
  }
}

// ============================================================
// 置顶
// ============================================================
const handleToggleTop = async (row) => {
  try {
    await toggleTopReview(row.id)
    ElMessage.success(row.isTop === 1 ? '已取消置顶' : '置顶成功')
    loadReviewList()
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  }
}

// ============================================================
// 删除
// ============================================================
const handleDelete = async (id) => {
  try {
    await deleteReview(id)
    ElMessage.success('删除成功')
    loadReviewList()
  } catch (e) {
    ElMessage.error('删除失败，请重试')
  }
}
</script>

<style scoped>
.review-manage {
  padding: 18px;
  color: #111827;
}

.commerce-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
  margin-bottom: 18px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88)),
      radial-gradient(circle at 90% 20%, rgba(192, 132, 47, 0.22), transparent 32%);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-kicker {
  color: #f7c76f;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.hero-copy h2 {
  margin: 8px 0 6px;
  color: #f8fafc;
  font-size: 24px;
  line-height: 1.2;
}

.hero-copy p {
  margin: 0;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 10px;
  min-width: 360px;
}

.metric-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.metric-card span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #f8fafc;
  font-size: 24px;
  line-height: 1;
}

.metric-card.warning strong {
  color: #facc15;
}

.filter-card {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  display: block;
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.table-header small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.stats { display: flex; align-items: center; gap: 8px; }
.ml-8  { margin-left: 8px; }
.ml-6  { margin-left: 6px; }
.mr-4  { margin-right: 4px; }

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-name {
  font-size: 13px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.user-cell {
  display: flex;
  align-items: center;
}

.content-cell {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 4px;
}
.content-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  word-break: break-all;
}
.image-preview {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
}
.reply-preview {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2563eb;
  font-size: 12px;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  padding: 4px 0;
}
.detail-section {
  margin-top: 16px;
}
.section-title {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #0f172a;
}
.review-content {
  color: #475569;
  line-height: 1.6;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 4px;
  word-break: break-all;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.reply-box {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  padding: 10px 12px;
  color: #67c23a;
  font-size: 13px;
  line-height: 1.6;
}
.reply-time {
  font-size: 12px;
  color: #a8abb2;
  margin-top: 4px;
  margin-bottom: 0;
}

.original-review {
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
}
.original-review p {
  margin: 6px 0 0;
  color: #606266;
  font-size: 13px;
}
.existing-reply {
  margin-bottom: 12px;
}

:deep(.el-card__header) {
  border-bottom-color: #e5e7eb;
  background: #fafafa;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 14px;
  margin-bottom: 12px;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
  --el-table-header-bg-color: #f8fafc;
  color: #334155;
}

:deep(.el-table th.el-table__cell) {
  color: #475569;
  font-weight: 800;
}

:deep(.el-table__row:hover > td.el-table__cell) {
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .commerce-hero {
    flex-direction: column;
  }

  .hero-metrics {
    min-width: 0;
  }
}
</style>
