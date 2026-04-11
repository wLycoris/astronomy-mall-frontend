<template>
  <div class="account-settings">

    <!-- 页面标题 -->
    <div class="page-header">
      <el-icon class="header-icon"><Setting /></el-icon>
      <span>账号设置</span>
    </div>

    <!-- Tab 卡片 -->
    <div class="settings-card">
      <el-tabs v-model="activeTab" class="settings-tabs">

        <!-- ===== Tab 1: 基本资料 ===== -->
        <el-tab-pane label="基本资料" name="profile">
          <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="80px"
              label-position="left"
              class="info-form"
          >
            <el-form-item label="用户名">
              <el-input :value="profileForm.username" disabled>
                <template #suffix>
                  <el-tag size="small" type="info" effect="plain">不可修改</el-tag>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input
                  v-model="profileForm.nickname"
                  placeholder="请输入昵称"
                  maxlength="50"
                  show-word-limit
                  clearable
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" clearable>
                <template #prefix><el-icon><Message /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input
                  v-model="profileForm.phone"
                  placeholder="请输入手机号"
                  maxlength="11"
                  clearable
              >
                <template #prefix><el-icon><Phone /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item label="所在地区">
              <!-- 自定义省市选择器 -->
              <div class="region-picker" v-click-outside="closeRegionPicker">
                <div
                    class="region-input"
                    :class="{ 'is-focus': regionPickerVisible }"
                    @click="toggleRegionPicker"
                >
                  <span v-if="profileForm.province || profileForm.city" class="region-value">
                    {{ profileForm.province }}{{ profileForm.province && profileForm.city ? ' / ' : '' }}{{ profileForm.city }}
                  </span>
                  <span v-else class="region-placeholder">请选择省份 / 城市</span>
                  <el-icon class="region-arrow" :class="{ 'is-open': regionPickerVisible }"><ArrowDown /></el-icon>
                </div>
                <!-- 下拉面板 -->
                <div v-show="regionPickerVisible" class="region-panel">
                  <!-- 左侧省份列表 -->
                  <ul class="region-col region-col-province">
                    <li
                        v-for="prov in provinceList"
                        :key="prov.label"
                        :class="['region-item', selectedProvince === prov.label && 'is-selected']"
                        @click="selectProvince(prov)"
                    >
                      {{ prov.label }}
                      <el-icon v-if="selectedProvince === prov.label" class="region-check"><Check /></el-icon>
                    </li>
                  </ul>
                  <!-- 右侧城市列表 -->
                  <ul class="region-col region-col-city">
                    <li
                        v-if="!selectedProvince"
                        class="region-tip"
                    >← 请先选择省份</li>
                    <li
                        v-for="city in cityList"
                        :key="city"
                        :class="['region-item', profileForm.city === city && 'is-selected']"
                        @click="selectCity(city)"
                    >
                      {{ city }}
                      <el-icon v-if="profileForm.city === city" class="region-check"><Check /></el-icon>
                    </li>
                  </ul>
                </div>
              </div>
            </el-form-item>

            <!-- 兴趣标签 -->
            <el-form-item label="兴趣标签">
              <div class="tags-box">
                <div class="selected-area">
                  <el-tag
                      v-for="tag in selectedTags"
                      :key="tag"
                      closable
                      type="primary"
                      class="sel-tag"
                      @close="removeTag(tag)"
                  >{{ tag }}</el-tag>
                  <span v-if="!selectedTags.length" class="empty-tip">点击下方标签添加</span>
                </div>
                <div class="preset-area">
                  <span
                      v-for="preset in presetTags"
                      :key="preset"
                      :class="['preset-chip', selectedTags.includes(preset) && 'active']"
                      @click="toggleTag(preset)"
                  >{{ preset }}</span>
                </div>
              </div>
            </el-form-item>

            <!-- 观测等级 -->
            <el-form-item label="观测等级">
              <div class="level-row">
                <el-tag
                    :type="getLevelType(profileForm.observationLevel)"
                    effect="dark"
                    class="level-badge"
                >
                  <el-icon><Star /></el-icon>
                  {{ getLevelName(profileForm.observationLevel) }}
                </el-tag>
                <span class="level-tip">系统根据购买记录自动更新，不可手动修改</span>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="profileSaving" @click="handleSaveProfile">
                保存修改
              </el-button>
              <el-button @click="resetProfile">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- ===== Tab 2: 头像照片 ===== -->
        <el-tab-pane label="头像照片" name="avatar">
          <div class="avatar-panel">

            <!-- 左侧：预览框 + URL输入 + 精选头像 -->
            <div class="avatar-panel-left">

              <!-- 大预览框 -->
              <div class="avatar-big-preview">
                <img :src="avatarPreviewSrc" class="avatar-big-img" @error="onAvatarError" />
              </div>

              <!-- 本地上传 -->
              <div class="upload-row">
                <el-button size="small" plain @click="triggerFileInput">
                  <el-icon><Upload /></el-icon>&nbsp;上传头像
                </el-button>
                <span class="avatar-url-tip">仅支持 JPG、GIF、PNG、JPEG、BMP 格式，文件小于 4M</span>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
                    style="display:none"
                    @change="handleFileChange"
                />
              </div>

              <div class="avatar-url-row">
                <el-input
                    v-model="avatarInput"
                    placeholder="粘贴图片 URL 即可更换头像"
                    clearable
                    size="small"
                    style="flex:1"
                >
                  <template #prefix><el-icon><Link /></el-icon></template>
                </el-input>
              </div>
              <div class="avatar-url-tip-inline">或粘贴图片直链：</div>

              <!-- 精选头像 -->
              <div class="preset-header">
                <span class="preset-title">精选头像</span>
                <span
                    v-for="cat in presetCategories"
                    :key="cat.key"
                    :class="['preset-cat', activePresetCat === cat.key && 'preset-cat-active']"
                    @click="activePresetCat = cat.key"
                >{{ cat.label }}</span>
              </div>
              <div class="preset-grid">
                <img
                    v-for="url in currentPresetAvatars"
                    :key="url"
                    :src="url"
                    :class="['preset-avatar-item', avatarInput === url && 'preset-avatar-selected']"
                    @click="avatarInput = url"
                />
              </div>
            </div>

            <!-- 右侧：效果预览 + 保存 -->
            <div class="avatar-panel-right">
              <div class="preview-title">效果预览</div>
              <div class="preview-tip">选择或填写图片链接后，可在此预览效果</div>

              <div class="preview-size-block">
                <img :src="avatarPreviewSrc" class="preview-100" @error="onAvatarError" />
                <span class="preview-size-label">100 × 100 像素</span>
              </div>

              <div class="preview-size-block">
                <img :src="avatarPreviewSrc" class="preview-50" @error="onAvatarError" />
                <span class="preview-size-label">50 × 50 像素</span>
              </div>

              <el-button
                  type="primary"
                  :loading="avatarSaving"
                  class="avatar-save-btn"
                  @click="handleSaveAvatar"
              >保 存</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- ===== Tab 3: 修改密码 ===== -->
        <el-tab-pane label="修改密码" name="password">

          <el-alert
              title="密码修改后将立即登出，请用新密码重新登录"
              type="warning"
              show-icon
              :closable="false"
              style="margin-bottom: 24px"
          />

          <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="100px"
              label-position="left"
              class="pwd-form"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                  clearable
                  autocomplete="current-password"
              >
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="6-20位，建议包含大小写和数字"
                  show-password
                  clearable
                  autocomplete="new-password"
              >
                <template #prefix><el-icon><Key /></el-icon></template>
              </el-input>
              <!-- 强度条 -->
              <div v-if="passwordForm.newPassword" class="strength-wrap">
                <div class="strength-tip">
                  密码强度：<b :style="{ color: strengthColor }">{{ strengthText }}</b>
                </div>
                <ul class="strength-bar">
                  <li :class="{ active: strengthLevel >= 1 }"></li>
                  <li :class="{ active: strengthLevel >= 2 }"></li>
                  <li :class="{ active: strengthLevel >= 3 }"></li>
                </ul>
              </div>
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                  clearable
                  autocomplete="new-password"
              >
                <template #prefix><el-icon><Key /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                  type="danger"
                  :loading="passwordSaving"
                  @click="handleChangePassword"
              >
                确认修改密码
              </el-button>
              <el-button @click="resetPasswordForm">清空</el-button>
            </el-form-item>
          </el-form>

        </el-tab-pane>
      </el-tabs>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Star, Lock, Key, Message, Phone, Link, Upload, ArrowDown, Check } from '@element-plus/icons-vue'
import { getUserInfo, updateUserInfo, changePasswordSecure } from '@/api/user'
import { removeToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('profile')

// ── 默认头像 ──────────────────────────────────
const DEFAULT_AVATAR = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const onAvatarError = (e) => { e.target.src = DEFAULT_AVATAR }

// ── 省市自定义选择器 ──────────────────────────────
const regionPickerVisible = ref(false)
const selectedProvince = ref('')

// 内联省市数据（精简版，直接用不依赖外部文件）
const REGION_DATA = [
  { label: '北京市', cities: ['东城区','西城区','朝阳区','丰台区','石景山区','海淀区','顺义区','通州区','大兴区','房山区','门头沟区','昌平区','平谷区','密云区','怀柔区','延庆区'] },
  { label: '天津市', cities: ['和平区','河东区','河西区','南开区','河北区','红桥区','滨海新区','东丽区','西青区','津南区','北辰区','武清区','宝坻区','静海区','宁河区','蓟州区'] },
  { label: '河北省', cities: ['石家庄市','唐山市','秦皇岛市','邯郸市','邢台市','保定市','张家口市','承德市','沧州市','廊坊市','衡水市'] },
  { label: '山西省', cities: ['太原市','大同市','朔州市','忻州市','阳泉市','吕梁市','晋中市','长治市','晋城市','临汾市','运城市'] },
  { label: '内蒙古自治区', cities: ['呼和浩特市','包头市','乌海市','赤峰市','通辽市','鄂尔多斯市','呼伦贝尔市','巴彦淖尔市','乌兰察布市'] },
  { label: '辽宁省', cities: ['沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市','阜新市','辽阳市','盘锦市','铁岭市','朝阳市','葫芦岛市'] },
  { label: '吉林省', cities: ['长春市','吉林市','四平市','辽源市','通化市','白山市','松原市','白城市','延边朝鲜族自治州'] },
  { label: '黑龙江省', cities: ['哈尔滨市','齐齐哈尔市','鸡西市','鹤岗市','双鸭山市','大庆市','伊春市','佳木斯市','七台河市','牡丹江市','黑河市','绥化市'] },
  { label: '上海市', cities: ['黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区','浦东新区','闵行区','宝山区','嘉定区','金山区','松江区','青浦区','奉贤区','崇明区'] },
  { label: '江苏省', cities: ['南京市','无锡市','徐州市','常州市','苏州市','南通市','连云港市','淮安市','盐城市','扬州市','镇江市','泰州市','宿迁市'] },
  { label: '浙江省', cities: ['杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','衢州市','舟山市','台州市','丽水市'] },
  { label: '安徽省', cities: ['合肥市','芜湖市','蚌埠市','淮南市','马鞍山市','淮北市','铜陵市','安庆市','黄山市','滁州市','阜阳市','宿州市','六安市','亳州市','池州市','宣城市'] },
  { label: '福建省', cities: ['福州市','厦门市','莆田市','三明市','泉州市','漳州市','南平市','龙岩市','宁德市'] },
  { label: '江西省', cities: ['南昌市','景德镇市','萍乡市','九江市','新余市','鹰潭市','赣州市','吉安市','宜春市','抚州市','上饶市'] },
  { label: '山东省', cities: ['济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','威海市','日照市','临沂市','德州市','聊城市','滨州市','菏泽市'] },
  { label: '河南省', cities: ['郑州市','开封市','洛阳市','平顶山市','安阳市','鹤壁市','新乡市','焦作市','濮阳市','许昌市','漯河市','三门峡市','南阳市','商丘市','信阳市','周口市','驻马店市'] },
  { label: '湖北省', cities: ['武汉市','黄石市','十堰市','宜昌市','襄阳市','鄂州市','荆门市','孝感市','荆州市','黄冈市','咸宁市','随州市','恩施土家族苗族自治州'] },
  { label: '湖南省', cities: ['长沙市','株洲市','湘潭市','衡阳市','邵阳市','岳阳市','常德市','张家界市','益阳市','郴州市','永州市','怀化市','娄底市','湘西土家族苗族自治州'] },
  { label: '广东省', cities: ['广州市','深圳市','珠海市','汕头市','佛山市','韶关市','湛江市','肇庆市','江门市','茂名市','惠州市','梅州市','汕尾市','河源市','阳江市','清远市','东莞市','中山市','潮州市','揭州市','云浮市'] },
  { label: '广西壮族自治区', cities: ['南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市'] },
  { label: '海南省', cities: ['海口市','三亚市','三沙市','儋州市'] },
  { label: '重庆市', cities: ['渝中区','江北区','南岸区','九龙坡区','大渡口区','沙坪坝区','北碚区','渝北区','巴南区','涪陵区','万州区','黔江区','长寿区','江津区','合川区','永川区','南川区','綦江区','大足区','璧山区','铜梁区','潼南区','荣昌区','开州区','梁平区','武隆区'] },
  { label: '四川省', cities: ['成都市','自贡市','攀枝花市','泸州市','德阳市','绵阳市','广元市','遂宁市','内江市','乐山市','南充市','眉山市','宜宾市','广安市','达州市','雅安市','巴中市','资阳市'] },
  { label: '贵州省', cities: ['贵阳市','六盘水市','遵义市','安顺市','毕节市','铜仁市'] },
  { label: '云南省', cities: ['昆明市','曲靖市','玉溪市','保山市','昭通市','丽江市','普洱市','临沧市'] },
  { label: '西藏自治区', cities: ['拉萨市','日喀则市','昌都市','林芝市','山南市','那曲市'] },
  { label: '陕西省', cities: ['西安市','铜川市','宝鸡市','咸阳市','渭南市','延安市','汉中市','榆林市','安康市','商洛市'] },
  { label: '甘肃省', cities: ['兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市','平凉市','酒泉市','庆阳市','定西市','陇南市'] },
  { label: '青海省', cities: ['西宁市','海东市'] },
  { label: '宁夏回族自治区', cities: ['银川市','石嘴山市','吴忠市','固原市','中卫市'] },
  { label: '新疆维吾尔自治区', cities: ['乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市'] },
  { label: '香港特别行政区', cities: ['香港岛','九龙','新界'] },
  { label: '澳门特别行政区', cities: ['澳门半岛','氹仔','路环'] },
  { label: '台湾省', cities: ['台北市','新北市','桃园市','台中市','台南市','高雄市'] },
]

const provinceList = computed(() => REGION_DATA)

const cityList = computed(() => {
  if (!selectedProvince.value) return []
  const prov = REGION_DATA.find(p => p.label === selectedProvince.value)
  return prov?.cities || []
})

const toggleRegionPicker = () => {
  regionPickerVisible.value = !regionPickerVisible.value
  if (regionPickerVisible.value && profileForm.province) {
    selectedProvince.value = profileForm.province
  }
}

const closeRegionPicker = () => {
  regionPickerVisible.value = false
}

const selectProvince = (prov) => {
  selectedProvince.value = prov.label
  profileForm.province = prov.label
  profileForm.city = ''
}

const selectCity = (city) => {
  profileForm.city = city
  regionPickerVisible.value = false
}

// v-click-outside 指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value() }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutside)
  }
}

// ── 观测等级 ──────────────────────────────────
const LEVEL_MAP = {
  1: { name: '入门级',  type: 'info' },
  2: { name: '初级玩家', type: 'success' },
  3: { name: '中级玩家', type: 'warning' },
  4: { name: '高级玩家', type: 'danger' },
  5: { name: '专家级',  type: '' }
}
const getLevelName = (l) => LEVEL_MAP[l]?.name || '未知'
const getLevelType = (l) => LEVEL_MAP[l]?.type ?? 'info'

// ── 兴趣标签 ──────────────────────────────────
// 📌 8.0 更新: 兴趣标签池与商品 tags 对齐，确保冷启动 Jaccard 匹配有效
const presetTags = [
  '深空摄影', '行星摄影', '星云', '星团', '星座观测',
  '日月食', '天文摄影后期', '入门望远镜', '双筒望远镜',
  '大口径望远镜', '便携设备', '天文相机', '目镜',
  '赤道仪', '极轴镜'
]
const selectedTags = ref([])

const toggleTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    if (selectedTags.value.length >= 8) {
      ElMessage.warning('最多选择 8 个兴趣标签')
      return
    }
    selectedTags.value.push(tag)
  }
}
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

// ── 基本资料 ──────────────────────────────────
const profileFormRef = ref(null)
const profileSaving = ref(false)
const originalProfile = ref({})

const profileForm = reactive({
  username: '', nickname: '', email: '',
  phone: '', province: '', city: '', avatar: '', observationLevel: 1
})

const profileRules = {
  nickname: [{ max: 50, message: '昵称最多50字符', trigger: 'blur' }],
  email:    [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  phone:    [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }]
}

const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    const info = res.data
    profileForm.username       = info.username || ''
    profileForm.nickname       = info.nickname || ''
    profileForm.email          = info.email || ''
    profileForm.phone          = info.phone || ''
    profileForm.province       = info.province || ''
    profileForm.city           = info.city || ''
    // 回填省份高亮
    if (info.province) selectedProvince.value = info.province
    profileForm.avatar         = info.avatar || ''
    profileForm.observationLevel = info.observationLevel || 1
    // 头像Tab的独立输入框同步为当前头像
    avatarInput.value = info.avatar || ''
    try { selectedTags.value = info.interestTags ? JSON.parse(info.interestTags) : [] }
    catch { selectedTags.value = [] }
    originalProfile.value = { ...profileForm, interestTagsStr: JSON.stringify(selectedTags.value) }
  } catch {
    ElMessage.error('加载用户信息失败')
  }
}

const handleSaveProfile = async () => {
  try { await profileFormRef.value.validate() } catch { return }
  profileSaving.value = true
  try {
    await updateUserInfo({
      nickname: profileForm.nickname, email: profileForm.email,
      phone: profileForm.phone, province: profileForm.province,
      city: profileForm.city, avatar: profileForm.avatar,
      interestTags: JSON.stringify(selectedTags.value)
    })
    ElMessage.success('资料保存成功 🌟')
    await userStore.fetchUserInfo()
    originalProfile.value = { ...profileForm, interestTagsStr: JSON.stringify(selectedTags.value) }
  } finally { profileSaving.value = false }
}

const resetProfile = () => {
  Object.assign(profileForm, originalProfile.value)
  try { selectedTags.value = JSON.parse(originalProfile.value.interestTagsStr || '[]') }
  catch { selectedTags.value = [] }
  // 同步还原省份高亮
  selectedProvince.value = profileForm.province || ''
  profileFormRef.value?.clearValidate()
  ElMessage.info('已还原')
}

// ── 头像照片Tab（独立状态，不与基本资料共用） ──────────
const avatarInput = ref('')  // Tab2 里单独的输入框，不影响 profileForm

// 预览用：优先显示 avatarInput，否则用默认
const avatarPreviewSrc = computed(() =>
    avatarInput.value && avatarInput.value.trim() ? avatarInput.value : DEFAULT_AVATAR
)

const activePresetCat = ref('all')
const presetCategories = [
  { key: 'all',   label: '全部' },
  { key: 'astro', label: '星空系' },
  { key: 'cute',  label: '可爱系' },
]
const presetAvatarMap = {
  astro: [
    'https://api.dicebear.com/7.x/bottts/svg?seed=moon&backgroundColor=1a1a2e',
    'https://api.dicebear.com/7.x/bottts/svg?seed=star&backgroundColor=16213e',
    'https://api.dicebear.com/7.x/bottts/svg?seed=comet&backgroundColor=0f3460',
    'https://api.dicebear.com/7.x/bottts/svg?seed=nebula&backgroundColor=533483',
    'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy&backgroundColor=1b262c',
    'https://api.dicebear.com/7.x/bottts/svg?seed=saturn&backgroundColor=2c3e50',
    'https://api.dicebear.com/7.x/bottts/svg?seed=mars&backgroundColor=922b21',
    'https://api.dicebear.com/7.x/bottts/svg?seed=jupiter&backgroundColor=784212',
  ],
  cute: [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Orion',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Stella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Cosmo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Vega',
  ]
}
const currentPresetAvatars = computed(() => {
  if (activePresetCat.value === 'all') return [...presetAvatarMap.astro, ...presetAvatarMap.cute]
  return presetAvatarMap[activePresetCat.value] || []
})

const avatarSaving = ref(false)

// ── 本地上传 ──────────────────────────────────
const fileInputRef = ref(null)
const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 4 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 4M')
    e.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => {
    avatarInput.value = evt.target.result  // base64 data URL
    ElMessage.success('图片已加载，点击保存生效')
  }
  reader.readAsDataURL(file)
  e.target.value = ''  // 清空 input，允许重复选同一文件
}
const handleSaveAvatar = async () => {
  avatarSaving.value = true
  try {
    // 保存时把 avatarInput 写回 profileForm.avatar，保持两边一致
    profileForm.avatar = avatarInput.value
    await updateUserInfo({
      nickname: profileForm.nickname, email: profileForm.email,
      phone: profileForm.phone, province: profileForm.province,
      city: profileForm.city, avatar: avatarInput.value,
      interestTags: JSON.stringify(selectedTags.value)
    })
    ElMessage.success('头像保存成功 🌟')
    // ⬇ 更新 store → UserLayout 侧边栏自动同步
    await userStore.fetchUserInfo()
    originalProfile.value = { ...profileForm, interestTagsStr: JSON.stringify(selectedTags.value) }
  } finally { avatarSaving.value = false }
}

// ── 修改密码 ──────────────────────────────────
const passwordFormRef = ref(null)
const passwordSaving = ref(false)

const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const validateConfirm = (rule, value, callback) => {
  value !== passwordForm.newPassword
      ? callback(new Error('两次密码不一致'))
      : callback()
}

const passwordRules = {
  oldPassword:     [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword:     [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const strengthLevel = computed(() => {
  const pw = passwordForm.newPassword
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) || /[a-z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return 1
  if (s <= 2) return 2
  return 3
})
const strengthCls  = computed(() => ['', 'weak', 'medium', 'strong'][strengthLevel.value])
const strengthText = computed(() => ['', '低', '中', '高'][strengthLevel.value])
const strengthColor = computed(() => ['', '#f56c6c', '#e6a23c', '#67c23a'][strengthLevel.value])

const handleChangePassword = async () => {
  try { await passwordFormRef.value.validate() } catch { return }
  try {
    await ElMessageBox.confirm(
        '密码修改后将立即登出，需用新密码重新登录，确定继续？',
        '修改密码确认',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
          align: 'center', appendToBody: true }
    )
  } catch { return }

  passwordSaving.value = true
  try {
    await changePasswordSecure({
      oldPassword:     passwordForm.oldPassword,
      newPassword:     passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    ElMessage.success('密码修改成功，即将跳转登录页')
    removeToken()
    userStore.$reset && userStore.$reset()
    setTimeout(() => {
      router.replace({ path: '/login', query: { message: 'password_changed' } })
    }, 1000)
  } finally { passwordSaving.value = false }
}

const resetPasswordForm = () => passwordFormRef.value?.resetFields()

onMounted(loadUserInfo)
</script>

<style scoped>
/* ── 整体容器 ──────────────────────────── */
.account-settings { padding: 4px; }

/* ── 标题 ──────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}
.header-icon { color: #409eff; font-size: 20px; }

/* ── 卡片容器 ──────────────────────────── */
.settings-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

/* ── Tab ───────────────────────────────── */
.settings-tabs :deep(.el-tabs__item) { font-size: 14px; color: #606266; }
.settings-tabs :deep(.el-tabs__item.is-active) { color: #409eff; font-weight: 600; }
.settings-tabs :deep(.el-tabs__active-bar) { background-color: #409eff; }
.settings-tabs :deep(.el-tabs__content) { padding-top: 20px; }

/* ── 表单 ────────────────────────────── */
.info-form, .pwd-form { max-width: 560px; }
/* ── 自定义省市选择器 ─────────────────── */
.region-picker {
  position: relative;
  width: 100%;
}

.region-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
  user-select: none;
}

.region-input:hover {
  border-color: #c0c4cc;
}

.region-input.is-focus {
  border-color: #409eff;
}

.region-value {
  font-size: 14px;
  color: #303133;
}

.region-placeholder {
  font-size: 14px;
  color: #a8abb2;
}

.region-arrow {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s;
}

.region-arrow.is-open {
  transform: rotate(180deg);
}

.region-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 9999;
  display: flex;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.region-col {
  width: 160px;
  max-height: 280px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.region-col-province {
  border-right: 1px solid #f0f0f0;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
  transition: background 0.15s;
}

.region-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.region-item.is-selected {
  color: #409eff;
  font-weight: 600;
  background: #ecf5ff;
}

.region-check {
  font-size: 12px;
  color: #409eff;
  flex-shrink: 0;
}

.region-tip {
  padding: 20px 14px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
}

/* ── 兴趣标签 ────────────────────────── */
.tags-box { width: 100%; }
.selected-area {
  display: flex; flex-wrap: wrap; gap: 6px;
  min-height: 38px; padding: 8px 10px;
  border: 1px solid #dcdfe6; border-radius: 6px;
  margin-bottom: 10px; background: #fafafa;
}
.sel-tag { cursor: default; }
.empty-tip { font-size: 13px; color: #c0c4cc; line-height: 24px; }
.preset-area { display: flex; flex-wrap: wrap; gap: 8px; }
.preset-chip {
  display: inline-block; padding: 4px 12px; font-size: 13px;
  border-radius: 20px; cursor: pointer;
  border: 1px solid #dcdfe6; color: #606266;
  background: #f4f4f5; transition: all 0.2s; user-select: none;
}
.preset-chip:hover { border-color: #409eff; color: #409eff; background: #ecf5ff; }
.preset-chip.active { border-color: #409eff; color: #fff; background: #409eff; }

/* ── 观测等级 ─────────────────────────── */
.level-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.level-badge { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.level-tip { font-size: 12px; color: #909399; }

/* ══ 头像面板 ══════════════════════════════════ */
.avatar-panel {
  display: flex;
  gap: 32px;
}

/* 左侧 */
.avatar-panel-left { flex: 1; min-width: 0; }

.avatar-big-preview {
  width: 100%;
  max-width: 340px;
  height: 220px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12px;
}
.avatar-big-img { max-width: 100%; max-height: 100%; object-fit: contain; }

.avatar-url-row { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.avatar-url-tip { font-size: 12px; color: #909399; margin-bottom: 14px; }

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.avatar-url-tip {
  font-size: 12px;
  color: #909399;
}

.avatar-url-tip-inline {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 4px;
}

/* 精选头像 */
.preset-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.preset-title { font-size: 13px; font-weight: 600; color: #303133; }
.preset-cat {
  font-size: 12px; color: #606266; cursor: pointer;
  padding: 2px 8px; border-radius: 4px; transition: all 0.2s;
}
.preset-cat:hover { color: #409eff; }
.preset-cat-active { color: #409eff; background: #ecf5ff; font-weight: 600; }

.preset-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  max-width: 340px;
}
.preset-avatar-item {
  width: 100%; aspect-ratio: 1; border-radius: 4px;
  cursor: pointer; border: 2px solid transparent;
  object-fit: cover; transition: all 0.2s; background: #f0f2f5;
}
.preset-avatar-item:hover { border-color: #409eff; transform: scale(1.05); }
.preset-avatar-selected { border-color: #409eff; box-shadow: 0 0 0 2px #b3d8ff; }

/* 右侧效果预览 */
.avatar-panel-right { width: 200px; flex-shrink: 0; }
.preview-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.preview-tip { font-size: 12px; color: #909399; margin-bottom: 16px; line-height: 1.5; }
.preview-size-block { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 16px; }
.preview-100 {
  width: 100px; height: 100px; object-fit: cover;
  border-radius: 4px; border: 1px solid #e4e7ed; background: #f5f7fa;
}
.preview-50 {
  width: 50px; height: 50px; object-fit: cover;
  border-radius: 4px; border: 1px solid #e4e7ed; background: #f5f7fa;
}
.preview-size-label { font-size: 12px; color: #909399; margin-top: 4px; }
.avatar-save-btn { width: 100%; margin-top: 8px; }

/* ── 密码强度 ─────────────────────────── */
.strength-wrap {
  margin-top: 10px;
}

.strength-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.strength-tip b {
  font-weight: 700;
  margin-left: 2px;
  transition: color 0.3s;
}

.strength-bar {
  display: flex;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.strength-bar li {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e4e7ed;
  transition: background 0.3s;
}

.strength-bar li:nth-child(1).active {
  background: #f56c6c;
}

.strength-bar li:nth-child(2).active {
  background: #e6a23c;
}

.strength-bar li:nth-child(3).active {
  background: #67c23a;
}
</style>