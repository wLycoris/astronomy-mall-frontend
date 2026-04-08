<template>
  <div class="forum-manage">
    <!-- ====================================================== -->
    <!-- 顶部 Tab 切换：审核 / 管理 / 评论 / 统计                  -->
    <!-- ====================================================== -->
    <el-tabs v-model="activeTab" class="forum-tabs" @tab-change="onTabChange">
      <!-- ====================================================== -->
      <!-- Tab1 帖子审核（待审核 status=1）                          -->
      <!-- ====================================================== -->
      <el-tab-pane name="audit">
        <template #label>
          <span class="tab-label">
            <el-icon><Warning /></el-icon>
            帖子审核
            <el-badge
                v-if="pendingCount > 0"
                :value="pendingCount"
                :max="99"
                class="pending-badge"
            />
          </span>
        </template>

        <el-card class="filter-card" shadow="never">
          <el-form inline>
            <el-form-item label="关键词">
              <el-input
                  v-model="auditQuery.keyword"
                  placeholder="标题/内容/作者"
                  clearable
                  style="width: 220px"
                  @keyup.enter="loadAuditList"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAuditList">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
              <el-button @click="resetAuditQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
          <div class="table-header">
            <el-tag type="warning">待审核 {{ auditTotal }} 条</el-tag>
          </div>

          <el-table
              v-loading="auditLoading"
              :data="auditList"
              border
              stripe
              style="width: 100%"
          >
            <el-table-column label="编号" prop="id" width="70" align="center" />

            <el-table-column label="封面" width="80" align="center">
              <template #default="{ row }">
                <el-image
                    v-if="row.coverImage"
                    :src="row.coverImage"
                    style="width: 50px; height: 50px; border-radius: 4px"
                    fit="cover"
                    :preview-src-list="[row.coverImage]"
                />
                <span v-else class="no-image">无图</span>
              </template>
            </el-table-column>

            <el-table-column label="标题" min-width="200">
              <template #default="{ row }">
                <div class="title-cell">
                  <span class="title-text">{{ row.title }}</span>
                  <div v-if="row.tags && row.tags.length" class="tag-list">
                    <el-tag
                        v-for="tag in row.tags"
                        :key="tag"
                        size="small"
                        type="info"
                        class="tag-item"
                    >
                      #{{ tag }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="作者" width="160">
              <template #default="{ row }">
                <div class="author-cell">
                  <el-avatar :src="row.authorAvatar" :size="28" />
                  <span class="author-name">{{ row.authorNickname || '用户' + row.userId }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="提交时间" prop="createTime" width="160" />

            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
                <el-button type="success" link size="small" @click="handleApprove(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="handleReject(row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
                v-model:current-page="auditQuery.pageNum"
                v-model:page-size="auditQuery.pageSize"
                :total="auditTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadAuditList"
                @current-change="loadAuditList"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ====================================================== -->
      <!-- Tab2 帖子管理（全部状态 + 推荐/删除）                     -->
      <!-- ⚠️ 7.7 重命名: 原"置顶"→"推荐"。底层 DB 字段仍为 is_top，   -->
      <!--   但用户端不感知，仅作为 8.x 推荐算法的加权信号使用。       -->
      <!-- ====================================================== -->
      <el-tab-pane name="manage">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            帖子管理
          </span>
        </template>

        <el-card class="filter-card" shadow="never">
          <el-form inline>
            <el-form-item label="状态">
              <el-select
                  v-model="manageQuery.status"
                  placeholder="全部状态"
                  clearable
                  style="width: 140px"
                  @change="loadManageList"
              >
                <el-option label="审核中" :value="1" />
                <el-option label="已发布" :value="2" />
                <el-option label="已拒绝" :value="3" />
                <el-option label="管理员删除" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                  v-model="manageQuery.keyword"
                  placeholder="标题/内容/作者"
                  clearable
                  style="width: 220px"
                  @keyup.enter="loadManageList"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadManageList">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
              <el-button @click="resetManageQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
          <div class="table-header">
            <el-tag type="info">共 {{ manageTotal }} 条</el-tag>
          </div>

          <el-table
              v-loading="manageLoading"
              :data="manageList"
              border
              stripe
              style="width: 100%"
          >
            <el-table-column label="编号" prop="id" width="70" align="center" />

            <el-table-column label="封面" width="80" align="center">
              <template #default="{ row }">
                <el-image
                    v-if="row.coverImage"
                    :src="row.coverImage"
                    style="width: 50px; height: 50px; border-radius: 4px"
                    fit="cover"
                    :preview-src-list="[row.coverImage]"
                />
                <span v-else class="no-image">无图</span>
              </template>
            </el-table-column>

            <el-table-column label="标题" min-width="200">
              <template #default="{ row }">
                <div class="title-cell">
                  <!-- ⚠️ row.isTop / row.isHot 来自 map 结果集，由于 MySQL JDBC tinyInt1isBit=true，
                       tinyint(1) 列会被当作 Boolean 返回（true/false 而非 1/0），
                       因此用 truthy 判断而不是 === 1
                       ⚠️ 7.7 重命名: row.isTop 现表示"管理员推荐"，仅后台可见 -->
                  <el-tag v-if="row.isTop" type="warning" size="small" class="mr-4">推荐</el-tag>
                  <el-tag v-if="row.isHot" type="danger" size="small" class="mr-4">热门</el-tag>
                  <span class="title-text">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="作者" width="140">
              <template #default="{ row }">
                <div class="author-cell">
                  <el-avatar :src="row.authorAvatar" :size="24" />
                  <span class="author-name">{{ row.authorNickname || '用户' + row.userId }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="点赞" prop="likeCount" width="70" align="center" />
            <el-table-column label="评论" prop="commentCount" width="70" align="center" />
            <el-table-column label="收藏" prop="collectCount" width="70" align="center" />
            <el-table-column label="浏览" prop="viewCount" width="70" align="center" />

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="发布时间" prop="createTime" width="160" />

            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
                <el-button
                    v-if="row.status === 2"
                    :type="row.isTop ? 'warning' : 'info'"
                    link
                    size="small"
                    @click="handleToggleTop(row)"
                >
                  {{ row.isTop ? '取消推荐' : '加入推荐' }}
                </el-button>
                <el-popconfirm
                    title="确定删除该帖子吗？"
                    @confirm="handleDelete(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" link size="small" :disabled="row.status === 4">
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
                v-model:current-page="manageQuery.pageNum"
                v-model:page-size="manageQuery.pageSize"
                :total="manageTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadManageList"
                @current-change="loadManageList"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ====================================================== -->
      <!-- Tab3 评论管理                                            -->
      <!-- ====================================================== -->
      <el-tab-pane name="comment">
        <template #label>
          <span class="tab-label">
            <el-icon><ChatLineRound /></el-icon>
            评论管理
          </span>
        </template>

        <el-card class="filter-card" shadow="never">
          <el-form inline>
            <el-form-item label="帖子ID">
              <el-input
                  v-model="commentQuery.postId"
                  placeholder="按帖子ID筛选"
                  clearable
                  style="width: 160px"
                  @keyup.enter="loadCommentList"
              />
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                  v-model="commentQuery.keyword"
                  placeholder="评论内容关键词"
                  clearable
                  style="width: 220px"
                  @keyup.enter="loadCommentList"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadCommentList">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
              <el-button @click="resetCommentQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
          <div class="table-header">
            <el-tag type="info">共 {{ commentTotal }} 条评论</el-tag>
          </div>

          <el-table
              v-loading="commentLoading"
              :data="commentList"
              border
              stripe
              style="width: 100%"
          >
            <el-table-column label="编号" prop="id" width="70" align="center" />

            <el-table-column label="评论用户" width="160">
              <template #default="{ row }">
                <div class="author-cell">
                  <el-avatar :src="row.userAvatar" :size="28" />
                  <span class="author-name">{{ row.userNickname || '用户' + row.userId }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="所属帖子" min-width="180">
              <template #default="{ row }">
                <span class="post-title-link">
                  #{{ row.postId }} {{ row.postTitle || '（帖子已删除）' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="评论内容" min-width="200">
              <template #default="{ row }">
                <div class="comment-content">
                  <el-tag
                      v-if="row.parentId !== 0 && row.replyToUsername"
                      size="small"
                      type="info"
                      class="mr-4"
                  >
                    回复 @{{ row.replyToUsername }}
                  </el-tag>
                  {{ row.content }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="点赞" prop="likeCount" width="70" align="center" />

            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '正常' : '已删除' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="发布时间" prop="createTime" width="160" />

            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-popconfirm
                    title="确定删除该评论吗？"
                    @confirm="handleDeleteComment(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" link size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
                v-model:current-page="commentQuery.pageNum"
                v-model:page-size="commentQuery.pageSize"
                :total="commentTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadCommentList"
                @current-change="loadCommentList"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ====================================================== -->
      <!-- Tab4 数据统计                                             -->
      <!-- ====================================================== -->
      <el-tab-pane name="stats">
        <template #label>
          <span class="tab-label">
            <el-icon><DataAnalysis /></el-icon>
            数据统计
          </span>
        </template>

        <div v-loading="statsLoading">
          <!-- 顶部数字卡片：今日数据 + 总量 -->
          <el-row :gutter="16" class="stat-row">
            <el-col :span="6">
              <el-card class="stat-card stat-blue" shadow="hover">
                <div class="stat-label">今日发帖</div>
                <div class="stat-value">{{ stats.todayPostCount || 0 }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card stat-green" shadow="hover">
                <div class="stat-label">今日评论</div>
                <div class="stat-value">{{ stats.todayCommentCount || 0 }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card stat-orange" shadow="hover">
                <div class="stat-label">今日活跃用户</div>
                <div class="stat-value">{{ stats.todayActiveUsers || 0 }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card stat-red" shadow="hover">
                <div class="stat-label">待审核</div>
                <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="stat-row">
            <el-col :span="8">
              <el-card class="stat-card stat-cyan" shadow="hover">
                <div class="stat-label">总帖子数</div>
                <div class="stat-value">{{ stats.totalPostCount || 0 }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card stat-purple" shadow="hover">
                <div class="stat-label">总评论数</div>
                <div class="stat-value">{{ stats.totalCommentCount || 0 }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card stat-pink" shadow="hover">
                <div class="stat-label">累计发帖用户</div>
                <div class="stat-value">{{ stats.totalUserCount || 0 }}</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 图表区 -->
          <el-row :gutter="16" class="stat-row">
            <el-col :span="14">
              <el-card class="chart-card" shadow="never">
                <template #header>
                  <span class="chart-title">📈 近7天发帖+评论趋势</span>
                </template>
                <div ref="trendChartRef" class="chart-box"></div>
              </el-card>
            </el-col>
            <el-col :span="10">
              <el-card class="chart-card" shadow="never">
                <template #header>
                  <span class="chart-title">📊 帖子状态分布</span>
                </template>
                <div ref="statusChartRef" class="chart-box"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ====================================================== -->
    <!-- 帖子详情弹窗（复用）                                      -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="detailVisible"
        title="帖子详情"
        width="720px"
        destroy-on-close
        append-to-body
    >
      <div v-if="currentPost" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="帖子ID">{{ currentPost.id }}</el-descriptions-item>
          <el-descriptions-item label="作者">
            {{ currentPost.authorNickname || '用户' + currentPost.userId }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentPost.status)">{{ statusName(currentPost.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentPost.createTime }}</el-descriptions-item>
          <el-descriptions-item label="点赞">{{ currentPost.likeCount }}</el-descriptions-item>
          <el-descriptions-item label="评论">{{ currentPost.commentCount }}</el-descriptions-item>
          <el-descriptions-item label="收藏">{{ currentPost.collectCount }}</el-descriptions-item>
          <el-descriptions-item label="浏览">{{ currentPost.viewCount }}</el-descriptions-item>
          <el-descriptions-item v-if="currentPost.rejectReason" label="拒绝原因" :span="2">
            <span class="reject-reason">{{ currentPost.rejectReason }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-title">标题</div>
          <h3 class="post-title">{{ currentPost.title }}</h3>
        </div>

        <div v-if="currentPost.tags && currentPost.tags.length" class="detail-section">
          <div class="section-title">标签</div>
          <el-tag
              v-for="tag in currentPost.tags"
              :key="tag"
              size="small"
              type="info"
              class="mr-4"
          >
            #{{ tag }}
          </el-tag>
        </div>

        <div class="detail-section">
          <div class="section-title">内容预览</div>
          <p class="post-content">{{ currentPost.content || '（无内容预览）' }}</p>
        </div>

        <div v-if="currentPost.coverImage" class="detail-section">
          <div class="section-title">封面图（共 {{ currentPost.imageCount || 1 }} 张）</div>
          <el-image
              :src="currentPost.coverImage"
              style="width: 200px; height: 200px; border-radius: 4px"
              fit="cover"
              :preview-src-list="[currentPost.coverImage]"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ====================================================== -->
    <!-- 拒绝原因弹窗                                              -->
    <!-- ====================================================== -->
    <el-dialog
        v-model="rejectVisible"
        title="拒绝帖子 - 请填写原因"
        width="480px"
        destroy-on-close
        append-to-body
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="帖子标题">
          <span>{{ rejectForm.postTitle }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" required>
          <el-input
              v-model="rejectForm.reason"
              type="textarea"
              :rows="4"
              maxlength="200"
              show-word-limit
              placeholder="请填写拒绝原因（将通过站内通知发送给作者）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  Warning, Document, ChatLineRound, DataAnalysis, Search
} from '@element-plus/icons-vue'
import {
  getPostList,
  auditPost,
  toggleTopPost,
  deletePost,
  getCommentList,
  deleteComment,
  getForumStats,
  getPendingCount
} from '@/api/admin/forum'

// ============================================================
// 状态：当前 Tab + 待审核数量（角标）
// ============================================================
const activeTab = ref('audit')
const pendingCount = ref(0)

// ============================================================
// Tab1 帖子审核
// ============================================================
const auditQuery = reactive({
  status: 1, // 固定 status=1（待审核）
  keyword: '',
  pageNum: 1,
  pageSize: 20
})
const auditList = ref([])
const auditTotal = ref(0)
const auditLoading = ref(false)

const loadAuditList = async () => {
  auditLoading.value = true
  try {
    const res = await getPostList(auditQuery)
    auditList.value = res.data?.list || []
    auditTotal.value = res.data?.total || 0
  } catch (err) {
    console.error('加载待审核列表失败', err)
    ElMessage.error('加载待审核列表失败')
  } finally {
    auditLoading.value = false
  }
}

const resetAuditQuery = () => {
  auditQuery.keyword = ''
  auditQuery.pageNum = 1
  loadAuditList()
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认通过帖子《${row.title}》的审核？`,
        '审核确认',
        { confirmButtonText: '通过', cancelButtonText: '取消', type: 'success' }
    )
    await auditPost(row.id, { action: 'approve' })
    ElMessage.success('审核通过，已通知作者')
    loadAuditList()
    refreshPendingCount()
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
      ElMessage.error(err.message || '审核失败')
    }
  }
}

// 拒绝弹窗
const rejectVisible = ref(false)
const rejectForm = reactive({ postId: null, postTitle: '', reason: '' })

const handleReject = (row) => {
  rejectForm.postId = row.id
  rejectForm.postTitle = row.title
  rejectForm.reason = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason || !rejectForm.reason.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  try {
    await auditPost(rejectForm.postId, {
      action: 'reject',
      reason: rejectForm.reason.trim()
    })
    ElMessage.success('已拒绝，原因已通过站内信通知作者')
    rejectVisible.value = false
    loadAuditList()
    refreshPendingCount()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '拒绝失败')
  }
}

// ============================================================
// Tab2 帖子管理
// ============================================================
const manageQuery = reactive({
  status: null,
  keyword: '',
  pageNum: 1,
  pageSize: 20
})
const manageList = ref([])
const manageTotal = ref(0)
const manageLoading = ref(false)

const loadManageList = async () => {
  manageLoading.value = true
  try {
    const res = await getPostList(manageQuery)
    manageList.value = res.data?.list || []
    manageTotal.value = res.data?.total || 0
  } catch (err) {
    console.error('加载帖子列表失败', err)
    ElMessage.error('加载帖子列表失败')
  } finally {
    manageLoading.value = false
  }
}

const resetManageQuery = () => {
  manageQuery.status = null
  manageQuery.keyword = ''
  manageQuery.pageNum = 1
  loadManageList()
}

// 7.7 重命名: 原"置顶/取消置顶"→"加入推荐/取消推荐"
// is_top 字段被复用为"管理员推荐信号"，由 8.x 推荐算法读取做加权
const handleToggleTop = async (row) => {
  try {
    await toggleTopPost(row.id)
    // ⚠️ row.isTop 是 Boolean（来自 map 结果集 tinyint(1) 转换），用 truthy 判断
    ElMessage.success(row.isTop ? '已取消推荐' : '已加入推荐')
    loadManageList()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await deletePost(id)
    ElMessage.success('帖子已删除')
    loadManageList()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '删除失败')
  }
}

// ============================================================
// Tab3 评论管理
// ============================================================
const commentQuery = reactive({
  postId: '',
  keyword: '',
  pageNum: 1,
  pageSize: 20
})
const commentList = ref([])
const commentTotal = ref(0)
const commentLoading = ref(false)

const loadCommentList = async () => {
  commentLoading.value = true
  try {
    const params = { ...commentQuery }
    // 空字符串转 undefined，避免后端按空字符串筛选
    if (!params.postId) params.postId = undefined
    if (!params.keyword) params.keyword = undefined
    const res = await getCommentList(params)
    commentList.value = res.data?.list || []
    commentTotal.value = res.data?.total || 0
  } catch (err) {
    console.error('加载评论列表失败', err)
    ElMessage.error('加载评论列表失败')
  } finally {
    commentLoading.value = false
  }
}

const resetCommentQuery = () => {
  commentQuery.postId = ''
  commentQuery.keyword = ''
  commentQuery.pageNum = 1
  loadCommentList()
}

const handleDeleteComment = async (id) => {
  try {
    await deleteComment(id)
    ElMessage.success('评论已删除')
    loadCommentList()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '删除失败')
  }
}

// ============================================================
// Tab4 数据统计 + ECharts
// ============================================================
const stats = ref({})
const statsLoading = ref(false)
const trendChartRef = ref(null)
const statusChartRef = ref(null)
let trendChart = null
let statusChart = null

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res = await getForumStats()
    stats.value = res.data || {}
    await nextTick()
    renderTrendChart(stats.value.last7DaysTrend || [])
    renderStatusChart(stats.value.statusDistribution || [])
  } catch (err) {
    console.error('加载统计数据失败', err)
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

const renderTrendChart = (trend) => {
  if (!trendChartRef.value) return
  if (!trendChart || trendChart.isDisposed()) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const dates = trend.map(t => t.date)
  const postCounts = trend.map(t => t.postCount)
  const commentCounts = trend.map(t => t.commentCount)
  trendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['发帖数', '评论数'], top: 4 },
    grid: { left: 50, right: 20, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '发帖数',
        type: 'line',
        data: postCounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64,158,255,0.12)' }
      },
      {
        name: '评论数',
        type: 'line',
        data: commentCounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#67c23a' },
        areaStyle: { color: 'rgba(103,194,58,0.12)' }
      }
    ]
  })
}

const renderStatusChart = (distribution) => {
  if (!statusChartRef.value) return
  if (!statusChart || statusChart.isDisposed()) {
    statusChart = echarts.init(statusChartRef.value)
  }
  const colorMap = {
    0: '#909399', // 草稿-灰
    1: '#e6a23c', // 审核中-黄
    2: '#67c23a', // 已发布-绿
    3: '#f56c6c', // 已拒绝-红
    4: '#909399'  // 管理员删除-灰
  }
  const pieData = (distribution || []).map(d => ({
    name: d.name,
    value: d.value,
    itemStyle: { color: colorMap[d.status] || '#409eff' }
  }))
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: pieData,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 }
    }]
  })
}

// ============================================================
// 公共：详情、状态映射、待审核刷新
// ============================================================
const detailVisible = ref(false)
const currentPost = ref(null)
const viewDetail = (row) => {
  currentPost.value = row
  detailVisible.value = true
}

const statusName = (s) => ({
  0: '草稿', 1: '审核中', 2: '已发布', 3: '已拒绝', 4: '管理员删除'
})[s] || '未知'

const statusTagType = (s) => ({
  0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'info'
})[s] || 'info'

const refreshPendingCount = async () => {
  try {
    const res = await getPendingCount()
    pendingCount.value = res.data || 0
  } catch (err) {
    // 静默失败
  }
}

// Tab 切换：按需懒加载
const onTabChange = (tab) => {
  if (tab === 'audit') loadAuditList()
  else if (tab === 'manage') loadManageList()
  else if (tab === 'comment') loadCommentList()
  else if (tab === 'stats') loadStats()
}

// 窗口缩放重绘图表
const handleResize = () => {
  trendChart?.resize()
  statusChart?.resize()
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadAuditList()
  refreshPendingCount()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  statusChart?.dispose()
})
</script>

<style lang="scss" scoped>
.forum-manage {
  padding: 0;
}

.forum-tabs {
  /* 顶部 tab 整体在深紫色背景上，需要把文字和分隔线调亮 */
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  :deep(.el-tabs__nav-wrap)::after {
    background-color: rgba(255, 255, 255, 0.15); /* 底部那条横线 */
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    padding: 0 24px;
    color: rgba(255, 255, 255, 0.65); /* 未选中：半透明白 */
    transition: color .2s;

    &:hover {
      color: #ffffff;
    }

    &.is-active {
      color: #67c5ff; /* 选中：亮蓝，与主题一致 */
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #67c5ff; /* 滑动下划线 */
    height: 3px;
    border-radius: 2px;
  }

  /* tab-label 内的图标颜色跟随父级 */
  :deep(.tab-label .el-icon) {
    color: inherit;
  }
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pending-badge {
  margin-left: 4px;
  :deep(.el-badge__content) {
    background-color: #f56c6c;
    border: 0;
  }
}

/* ── 筛选 + 表格卡片 ── */
.filter-card {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}

.table-card {
  border: 1px solid #ebeef5;
}

.table-header {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* ── 单元格样式 ── */
.no-image {
  display: inline-block;
  width: 50px;
  height: 50px;
  line-height: 50px;
  text-align: center;
  background: #f4f4f5;
  color: #c0c4cc;
  font-size: 12px;
  border-radius: 4px;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .title-text {
    font-weight: 500;
    color: #303133;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-item {
    font-size: 11px;
  }
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .author-name {
    font-size: 13px;
    color: #606266;
  }
}

.post-title-link {
  color: #409eff;
  font-size: 13px;
}

.comment-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.mr-4 { margin-right: 4px; }

/* ── 详情弹窗 ── */
.detail-content {
  .detail-section {
    margin-top: 16px;

    .section-title {
      font-weight: 600;
      font-size: 14px;
      color: #303133;
      margin-bottom: 8px;
      border-left: 3px solid #409eff;
      padding-left: 8px;
    }
  }

  .post-title {
    margin: 0;
    color: #303133;
  }

  .post-content {
    margin: 0;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
    background: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
  }

  .reject-reason {
    color: #f56c6c;
  }
}

/* ── 数据统计卡片 ── */
.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  border: 0;
  color: #fff;
  border-radius: 8px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .stat-label {
    font-size: 13px;
    opacity: 0.85;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
  }
}

.stat-blue   { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-green  { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-red    { background: linear-gradient(135deg, #f56c6c, #f78989); }
.stat-cyan   { background: linear-gradient(135deg, #06b6d4, #22d3ee); }
.stat-purple { background: linear-gradient(135deg, #8e44ad, #a569bd); }
.stat-pink   { background: linear-gradient(135deg, #ec4899, #f472b6); }

.chart-card {
  border: 1px solid #ebeef5;

  .chart-title {
    font-weight: 600;
    color: #303133;
  }

  .chart-box {
    height: 320px;
  }
}
</style>
