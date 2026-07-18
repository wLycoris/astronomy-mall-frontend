-- =============================================
-- 天文器材商城系统 - 数据库表完整设计
-- =============================================
-- 版本: v8.60
-- 最后更新: 2026-04-16
-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 表数统计 (v8.60 最终版，SHOW TABLES 实测对齐)
-- ═══════════════════════════════════════════════════════════════════════════
-- 实际已建: 44 张 ✅
-- 答辩口径算术: 早期规划 48 − 架构砍掉 2 − 可选未建 2 = 44 张
--
-- 分类明细 (合计 44):
--   ┌──────────────┬──────┬──────────────────────────────────────────────────┐
--   │ 模块          │ 表数 │ 表名                                              │
--   ├──────────────┼──────┼──────────────────────────────────────────────────┤
--   │ 用户相关      │   2  │ tb_user / tb_login_log                            │
--   │ 商城商品      │   3  │ tb_category / tb_product / tb_cart                │
--   │ 订单支付      │   4  │ tb_order / tb_order_item / tb_payment / tb_refund │
--   │ 评价举报      │   3  │ tb_review / tb_review_like / tb_review_report     │
--   │ 个人空间      │   2  │ tb_address / tb_balance_log                       │
--   │ 售后服务      │   3  │ tb_installation / tb_service_reminder / tb_recycling │
--   │ 商品收藏      │   1  │ tb_product_favorite                               │
--   │ AI识别        │   1  │ tb_recognition                                    │
--   │ 后台管理      │   4  │ tb_admin_log / tb_product_log / tb_stock_log / tb_system_setting │
--   │ 通知系统      │   3  │ tb_notification / tb_notification_template(35条) / tb_user_notification_setting │
--   │ 课程模块      │   5  │ tb_course / tb_course_chapter / tb_course_progress / tb_course_favorite / tb_course_review │
--   │ 地理位置      │   3  │ tb_observation_spot / tb_user_checkin / tb_spot_rating │
--   │ 论坛模块      │   7  │ tb_post / tb_post_comment / tb_post_like / tb_post_collect / tb_comment_like / tb_user_follow / tb_search_log │
--   │ 推荐系统      │   3  │ tb_browse_log / tb_post_browse_log / tb_recommend_record │
--   └──────────────┴──────┴──────────────────────────────────────────────────┘
--   总计:            44 张 ✅
--
-- 架构砍掉(2张 / v8.34 决策):
--   ❌ tb_post_image → 改用 tb_post.images varchar(2000) JSON 数组存 URL
--   ❌ tb_post_tag   → 改用 tb_post.tags   varchar(500)  JSON 数组存标签
--   砍掉理由: 帖子发布/详情场景下多表 JOIN 开销 > 字段语义清晰收益，与商品/课程标签体系对齐
--
-- 可选未建(2张 / demo 无需建):
--   ⬜ tb_recommend_config  → CF 权重直接用 application.yml 的 recommend.* 配置项
--   ⬜ tb_course_browse_log → 课程浏览埋点可复用 tb_browse_log，无独立建表必要
-- =============================================
-- ℹ️ v8.60 / 8.4 推荐系统通知 bugfix (2026-04-16): 数据库 0 变更
--    本轮修复 RecommendServiceImpl.getRecognitionCourseRecommend 两处业务逻辑缺陷，
--    使 COURSE_RECOMMEND 通知真正可以触发：
--      ① EN_TO_ZH_TAG_MAPPING 精确匹配 → 子串包含匹配 (Astrometry 返回 "Andromeda Galaxy"/
--         "emission nebula"/"The star ν And" 等带限定词短语，精确查 "galaxy" key 全 miss)
--      ② 热门兜底池 getHotCourses(userId, limit*2) → getHotCourses(userId, Math.max(limit*10, 20))
--         (用户 10001 已学 29 门 / 全库 51 门，Top2 热门全在 learned 集合 → 过滤后空返回)
--    数据读取模式零变化:
--      - tb_recognition.machine_tags  (读取方式变化: 对每个 tag 用 EN_TO_ZH_TAG_MAPPING 子串匹配)
--      - tb_course (以 tags 关键字召回 + 按热度兜底，读取 SQL 未改)
--      - tb_course_progress (用户已学列表过滤，读取 SQL 未改)
--    无新建表、无字段变更、无 INSERT；通知模板 id=34/35 在 v8.59 已落库。
-- =============================================
-- ℹ️ v8.59 / 8.4 推荐系统通知集成 (2026-04-16): tb_notification_template +2 行
--    新增 2 条推荐通知模板（执行 8.4_recommendation_notification_templates.sql）:
--      - id=34: RECOMMEND_PRODUCT_RECOMMEND (module=recommend, type=product_recommend)
--        触发: PriceDropScheduler 降价检测 + interest_tags 命中商品标签时
--      - id=35: RECOMMEND_COURSE_RECOMMEND (module=recommend, type=course_recommend)
--        触发: RecognitionPollScheduler 识别成功后 Top1 匹配课程时
--    表结构零变更（仅 INSERT 数据行）
--    新增数据读取模式:
--      - tb_user.interest_tags  (PriceDropScheduler 读取用户兴趣标签做交集判断)
--      - tb_product.tags        (PriceDropScheduler 读取商品标签做交集判断)
-- =============================================
-- ℹ️ v8.58 / 支付模块 4 Bug 修复 (2026-04-16): 数据库 0 变更
--    本轮纯 bugfix，涉及：
--      - PaymentServiceImpl.getPaymentByOrderId 幂等化（查无记录 return null）
--      - PaymentPage.vue 综合重构（walletLoaded 守卫 / pageReady 门闩 / 基于 createTime 的倒计时 /
--        复用 status=0 支付记录 / paymentAmount 后端为准防篡改 / 默认超时 15→30min）
--    数据读取模式零变化:
--      - tb_user.balance        (2.4.4 钱包余额，经 WalletVO.balance 返回前端，PaymentPage 侧仍通过 GET /api/user/wallet 实时拉取)
--      - tb_payment             (getPaymentByOrderId 读取逻辑未变，仅抛异常改为 return null)
--      - tb_balance_log         (余额支付扣款写流水链路未改动)
--      - tb_order.create_time   (新用途: 支付页倒计时基准，getOrderDetail 附带返回)
--    接口形态变化:
--      - GET /api/payment/order/{orderId}  返回值由「必抛 BusinessException」改为「可能为 null」
--        （前端已同步兼容，其他调用方本就未处理 404-like 异常，影响面可控）
-- =============================================
-- ℹ️ v8.57 / 8.3 跨模块联动推荐 (2026-04-15): 数据库 0 变更
--    本轮仅在 RecommendServiceImpl 增量实现 3 个跨模块方法 + 5 个前端页面改造，
--    完全复用已有表字段，无新建表、无字段变更、无 INSERT。
--    新增读取模式:
--      - tb_recognition.machine_tags     (8.3.1 识别→课程: 英文标签集合,经 EN_TO_ZH_TAG_MAPPING 转中文)
--      - tb_course.tags + tb_course_progress  (8.3.2 完课→下一门: tags Jaccard 排序 + 排除已学/在学)
--      - tb_observation_spot.altitude
--        + tb_observation_spot.light_pollution_level (8.3.3 签到→器材: 物理属性映射候选标签池)
--      - tb_post_browse_log              (8.3.4 帖子推荐: 已有埋点表,本轮 ForumDetail.vue 触发写入)
--    新增 Redis Key:
--      - recommend:spot:equip:{spotId}   TTL=30min  (观测点器材推荐结果缓存,物理属性稳定故长 TTL)
-- =============================================
-- ℹ️ v8.56 / 8.2 商品推荐主场景 (2026-04-14): 数据库 0 变更
--    本轮仅接入 Redis 缓存 + 前端 3 个推荐区块 + parseTags 兼容修复，
--    完全复用 8.0 已建的 tb_browse_log / tb_recommend_record 表。
--    新增使用模式:
--      - tb_browse_log 由 ProductDetail.vue onMounted 通过 POST /api/recommend/browse 写入
--        (Redis SETNX 去重失败时降级为直接写库，保证可观察性)
--      - tb_recommend_record 前端点击推荐卡片时通过 POST /api/recommend/click 回写
--        is_clicked=1 + click_time (字段 recommendType + targetId 与 RecommendClickDTO 对齐)
-- =============================================
-- ℹ️ v8.55 / 8.0+8.1 推荐系统 (2026-04-11): 新建 3 张表
--    tb_browse_log (商品浏览记录,Redis SETNX 30min去重,90天清理) ✅
--    tb_post_browse_log (帖子浏览记录,Redis SETNX 30min去重,90天清理) ✅
--    tb_recommend_record (推荐曝光+点击记录,答辩展示点击率统计) ✅
--    SQL文件: src/main/resources/sql/8.0_recommend_tables.sql
-- =============================================
-- ℹ️ v8.54 / 7.8 补丁 (2026-04-09): 数据库 0 变更
--    本轮仅前端修复 + 新增 ForumNotification.vue 论坛通知中心页面 +
--    ForumLayout 侧边栏通知按钮改造 + router bug 修复；
--    完全复用已有 tb_notification / tb_notification_template 表与接口，
--    无新建表、无字段变更、无 INSERT。
-- =============================================
-- ⚠️ 7.7.x / 7.8 (2026-04-08) 重要变更:
-- 📌 tb_notification_template 论坛 9 条模板全部入库 (id 25-33):
--    25 = FORUM_POST_APPROVED   (7.7) jumpUrl=/forum/list?postId={postId}
--    26 = FORUM_POST_REJECTED   (7.7) jumpUrl=/forum/list?postId={postId}
--    27 = FORUM_POST_LIKED      (7.8) jumpUrl=/forum/list?postId={postId}
--    28 = FORUM_POST_COMMENTED  (7.8) jumpUrl=/forum/list?postId={postId}
--    29 = FORUM_COMMENT_REPLIED (7.8) jumpUrl=/forum/list?postId={postId}
--    30 = FORUM_POST_COLLECTED  (7.8) jumpUrl=/forum/list?postId={postId}
--    31 = FORUM_MENTIONED       (7.8) jumpUrl=/forum/list?postId={postId}
--    32 = FORUM_USER_FOLLOWED   (7.8) jumpUrl=/forum/user/{followerId}（补 7.5 遗漏）
--    33 = FORUM_POST_TRENDING   (7.8) jumpUrl=/forum/list?postId={postId} priority=1
--    SQL文件: src/main/resources/sql/7.8_forum_notification_templates.sql
-- 📌 重要陷阱: mysql 命令行执行 7.8 SQL 必须加 --default-character-set=utf8mb4
--    否则 mysql.exe 默认 latin1 → 中文 UTF-8 字节按 latin1 单字节翻译
--    → ERROR 1406 (22001) Data too long for column 'content_template'
-- 📌 tb_post_comment 删除策略更新（AdminPostServiceImpl.deleteComment 级联）:
--    删除顶级评论(parent_id=0)时，自动级联软删所有 parent_id=该评论ID 的子回复，
--    帖子 tb_post.comment_count 同步按实际删除条数 -N（原固定 -1）。
--    依据 schema：parent_id 始终指向"顶级评论"ID（两级评论结构），无需递归。
--    所有子回复同样走 @TableLogic 软删，未来需要恢复时 deleted=0 即可复原。
-- 📌 tb_post.is_top 字段语义重新定位（不改 DDL，仅注释/语义层）:
--    原: "置顶"（用户列表 ORDER BY p.is_top DESC）
--    新: "管理员推荐信号"（仅后台标记，用户端不感知）
--        - 7.7.x 已从 PostMapper.xml 用户列表排序中移除
--        - 8.x 推荐算法读取此字段作为 hot_score 的额外加权因子
--        - 字段名暂未 rename，避免 migration 风险
-- 📌 MySQL JDBC 默认 tinyInt1isBit=true 行为提醒:
--    tinyint(1) 列在 MyBatis 走 Map<String,Object> 返回时会被解析为 Boolean，
--    而非 Integer。前端拿 row.isTop / row.isHot / row.deleted 时应用真值判断
--    （`if (row.isTop)`），不要写 `=== 1`。实体类查询无此问题。
-- =============================================
-- ⚠️ 6.1/6.2/6.3 重要字段名对照（XML/Service必须使用数据库列名）:
-- 📌 6.2 无新增表，天气数据来自高德API实时查询，月相为纯算法计算
-- 📌 6.2 新增VO: WeatherVO(condition/suitabilityScore等) + TonightVO(moonPhase/overallScore等)
-- 📌 6.3 无新增表，签到使用6.0已建的tb_user_checkin; SpotDetailVO新增todayCheckedIn/checkinWeather/checkinMoonPhase
-- 📌 6.3 评分改为可修改（tb_spot_rating UPDATE替代INSERT拒绝），uk_user_spot约束不变
-- ⚠️ 6.1 重要字段名对照（XML/Service必须使用数据库列名）:
--   tb_observation_spot.spot_name           ← entity.spotName
--   tb_observation_spot.light_pollution_level ← entity.lightPollutionLevel
--   tb_observation_spot.rating_count        ← entity.ratingCount
--   tb_user_checkin.checkin_date            ← 今日签到判断字段（date类型，非create_time）
-- =============================================

-- =============================================
-- ① 用户表 ✅
-- =============================================
-- 关联: tb_login_log / tb_cart / tb_order / tb_payment / tb_refund
--       tb_review / tb_balance_log / tb_recycling / tb_address
--       tb_recognition / tb_course_progress / tb_course_favorite
--       tb_observation_spot(签到) / tb_user_follow
-- 重要字段:
--   interest_tags: 推荐系统冷启动
--   role: 0-普通用户 1-管理员
--   balance: 钱包余额(BalanceService统一入口,严禁直接UPDATE)
--   longitude/latitude: 用户常用位置坐标,填写地址时更新,供推荐系统使用
-- =============================================
CREATE TABLE `tb_user` (
  `id`               bigint(20)    NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`         varchar(50)   NOT NULL COMMENT '用户名',
  `password`         varchar(100)  NOT NULL COMMENT '密码(MD5加密)',
  `nickname`         varchar(50)   DEFAULT NULL COMMENT '昵称',
  `email`            varchar(100)  DEFAULT NULL COMMENT '邮箱',
  `phone`            varchar(20)   DEFAULT NULL COMMENT '手机号',
  `avatar`           mediumtext    COMMENT '头像URL或base64图片数据',
  `interest_tags`    varchar(255)  DEFAULT NULL COMMENT '兴趣标签(JSON数组) 📌推荐系统冷启动',
  `observation_level` tinyint(1)   DEFAULT '1' COMMENT '观测经验等级(1入门-5专家)',
  `city`             varchar(50)   DEFAULT NULL COMMENT '所在城市',
  `province`         varchar(50)   DEFAULT NULL COMMENT '所在省份',
  `longitude`        decimal(10,7) DEFAULT NULL COMMENT '用户常用位置经度(填写地址时更新,供推荐系统和地理位置模块使用) 📌地理位置模块',
  `latitude`         decimal(10,7) DEFAULT NULL COMMENT '用户常用位置纬度(填写地址时更新,供推荐系统和地理位置模块使用) 📌地理位置模块',
  `role`             tinyint(1)    DEFAULT '0' COMMENT '角色(0-普通用户 1-管理员)',
  `status`           tinyint(1)    DEFAULT '1' COMMENT '状态(0-禁用 1-启用)',
  `deleted`          tinyint(1)    DEFAULT '0' COMMENT '逻辑删除',
  `create_time`      datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`      datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_time`  datetime      DEFAULT NULL COMMENT '最后登录时间',
  `balance`          decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '账户余额 📌钱包系统/二手回收入账',
  `collect_visible`  tinyint(1)    NOT NULL DEFAULT '0' COMMENT '收藏列表是否公开(0-私密 1-公开) 📌7.5用户主页',
  `like_visible`     tinyint(1)    NOT NULL DEFAULT '0' COMMENT '点赞列表是否公开(0-私密 1-公开) 📌7.5用户主页',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =============================================
-- ② 登录日志表 ✅
-- =============================================
CREATE TABLE `tb_login_log` (
  `id`         bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`    bigint(20)   NOT NULL COMMENT '用户ID 📌关联tb_user.id',
  `username`   varchar(50)  NOT NULL,
  `login_time` datetime     DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(50)  DEFAULT NULL,
  `device`     varchar(255) DEFAULT NULL,
  `status`     tinyint(1)   DEFAULT '1' COMMENT '0-失败 1-成功',
  `message`    varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';

-- =============================================
-- ③ 商品分类表 ✅
-- =============================================
CREATE TABLE `tb_category` (
  `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50)  NOT NULL,
  `parent_id`     bigint(20)   DEFAULT '0' COMMENT '父分类ID(0=一级分类)',
  `level`         tinyint(4)   DEFAULT '1' COMMENT '1-一级 2-二级',
  `icon`          varchar(200) DEFAULT NULL,
  `sort`          int(11)      DEFAULT '0' COMMENT '排序(越大越靠前)',
  `is_show`       tinyint(1)   DEFAULT '1' COMMENT '是否显示',
  `description`   varchar(200) DEFAULT NULL,
  `deleted`       tinyint(1)   DEFAULT '0',
  `create_time`   datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- =============================================
-- ④ 商品表 ✅
-- =============================================
-- 重要字段:
--   tags: 与tb_course.tags / tb_post.tags格式一致,推荐系统标签匹配核心字段
--   sales: 销量字段,AI识别推荐兜底排序依据(非sales_count)
-- =============================================
CREATE TABLE `tb_product` (
  `id`           bigint(20)    NOT NULL AUTO_INCREMENT,
  `product_name` varchar(200)  NOT NULL COMMENT '商品名称',
  `subtitle`     varchar(300)  DEFAULT NULL,
  `category_id`  bigint(20)    NOT NULL COMMENT '分类ID 📌关联tb_category.id',
  `brand`        varchar(100)  DEFAULT NULL,
  `main_image`   varchar(500)  DEFAULT NULL COMMENT '主图URL',
  `images`       text          DEFAULT NULL COMMENT '图片列表(JSON数组)',
  `description`  text          DEFAULT NULL COMMENT '商品详情(富文本)',
  `price`        decimal(10,2) NOT NULL COMMENT '现价',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `stock`        int(11)       DEFAULT '0' COMMENT '库存',
  `sales`        int(11)       DEFAULT '0' COMMENT '销量 📌AI识别推荐排序依据',
  `status`       tinyint(4)    DEFAULT '0' COMMENT '0-下架 1-上架',
  `is_recommend` tinyint(1)    DEFAULT '0' COMMENT '是否推荐',
  `is_hot`       tinyint(1)    DEFAULT '0' COMMENT '是否热卖',
  `is_new`       tinyint(1)    DEFAULT '0' COMMENT '是否新品',
  `tags`         varchar(500)  DEFAULT NULL COMMENT '商品标签(JSON数组,推荐系统parseTags同时兼容CSV历史格式) 📌推荐系统/AI识别推荐',
  `create_time`  datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted`      tinyint(1)    DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_tags` (`tags`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- =============================================
-- ⑤ 购物车表 ✅
-- =============================================
CREATE TABLE `tb_cart` (
  `id`         bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`    bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `product_id` bigint(20)   NOT NULL COMMENT '📌关联tb_product.id',
  `quantity`   int(11)      DEFAULT '1',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- =============================================
-- ⑥ 订单表 ✅
-- =============================================
-- 已包含物流字段(logistics_company/tracking_number/logistics_status/admin_remark)
-- =============================================
CREATE TABLE `tb_order` (
  `id`               bigint(20)    NOT NULL AUTO_INCREMENT,
  `order_no`         varchar(32)   NOT NULL COMMENT '订单编号',
  `user_id`          bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `total_amount`     decimal(10,2) NOT NULL COMMENT '商品总额',
  `freight_amount`   decimal(10,2) DEFAULT '0.00' COMMENT '运费',
  `payment_amount`   decimal(10,2) NOT NULL COMMENT '实付金额',
  `status`           tinyint(4)    DEFAULT '0' COMMENT '0待支付 1待发货 2待收货 3已完成 4已取消',
  `receiver_name`    varchar(50)   DEFAULT NULL COMMENT '收货人',
  `receiver_phone`   varchar(20)   DEFAULT NULL,
  `receiver_province` varchar(50)  DEFAULT NULL,
  `receiver_city`    varchar(50)   DEFAULT NULL,
  `receiver_district` varchar(50)  DEFAULT NULL,
  `receiver_address` varchar(200)  DEFAULT NULL COMMENT '详细地址',
  `user_remark`      varchar(500)  DEFAULT NULL,
  `admin_remark`     varchar(500)  DEFAULT NULL,
  `logistics_company` varchar(100) DEFAULT NULL COMMENT '物流公司',
  `tracking_number`  varchar(100)  DEFAULT NULL COMMENT '快递单号',
  `logistics_status` tinyint(4)    DEFAULT '0' COMMENT '0未发货 1运输中 2派送中 3已签收',
  `pay_time`         datetime      DEFAULT NULL COMMENT '支付时间',
  `deliver_time`     datetime      DEFAULT NULL COMMENT '发货时间',
  `receive_time`     datetime      DEFAULT NULL COMMENT '收货时间',
  `create_time`      datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`      datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_tracking_number` (`tracking_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- =============================================
-- ⑦ 订单详情表 ✅
-- =============================================
CREATE TABLE `tb_order_item` (
  `id`            bigint(20)    NOT NULL AUTO_INCREMENT,
  `order_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_order.id',
  `product_id`    bigint(20)    NOT NULL COMMENT '📌关联tb_product.id',
  `product_name`  varchar(200)  NOT NULL COMMENT '商品名称快照',
  `product_image` varchar(500)  DEFAULT NULL COMMENT '商品图片快照',
  `product_price` decimal(10,2) NOT NULL COMMENT '购买时单价快照',
  `quantity`      int(11)       NOT NULL DEFAULT '1',
  `total_price`   decimal(10,2) NOT NULL COMMENT '小计=单价×数量',
  `create_time`   datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单详情表';

-- =============================================
-- ⑧ 支付记录表 ✅
-- =============================================
CREATE TABLE `tb_payment` (
  `id`             bigint(20)    NOT NULL AUTO_INCREMENT,
  `payment_no`     varchar(32)   NOT NULL COMMENT '支付流水号',
  `order_id`       bigint(20)    NOT NULL COMMENT '📌关联tb_order.id',
  `order_no`       varchar(32)   NOT NULL,
  `user_id`        bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `payment_type`   tinyint(4)    NOT NULL COMMENT '1-支付宝 2-微信 3-余额',
  `payment_amount` decimal(10,2) NOT NULL,
  `status`         tinyint(4)    DEFAULT '0' COMMENT '0待支付 1成功 2失败 3已退款',
  `payment_time`   datetime      DEFAULT NULL,
  `transaction_id` varchar(64)   DEFAULT NULL COMMENT '第三方流水号',
  `remark`         varchar(200)  DEFAULT NULL,
  `create_time`    datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`    datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- =============================================
-- ⑨ 退款记录表 ✅
-- =============================================
-- 已包含审核字段(admin_id/admin_remark/audit_time)
-- =============================================
CREATE TABLE `tb_refund` (
  `id`            bigint(20)    NOT NULL AUTO_INCREMENT,
  `refund_no`     varchar(32)   NOT NULL,
  `payment_id`    bigint(20)    NOT NULL COMMENT '📌关联tb_payment.id',
  `order_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_order.id',
  `order_no`      varchar(32)   NOT NULL,
  `user_id`       bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `refund_amount` decimal(10,2) NOT NULL,
  `refund_reason` varchar(200)  NOT NULL,
  `refund_type`   tinyint(4)    DEFAULT '1' COMMENT '1-仅退款 2-退货退款',
  `status`        tinyint(4)    DEFAULT '0' COMMENT '0待审核 1审核通过 2审核拒绝 3退款成功 4退款失败',
  `admin_id`      bigint(20)    DEFAULT NULL COMMENT '审核管理员ID',
  `admin_remark`  varchar(200)  DEFAULT NULL,
  `audit_time`    datetime      DEFAULT NULL,
  `refund_time`   datetime      DEFAULT NULL,
  `create_time`   datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录表';

-- =============================================
-- ⑩ 商品评价表 ✅
-- =============================================
-- 重要字段:
--   status: 0管理员删除 1正常 2待审核(举报3次自动进入)
--   deleted: @TableLogic, 用户自己删除
--   is_top/top_time: 置顶排序
--   report_count: 举报次数
-- =============================================
CREATE TABLE `tb_review` (
  `id`           bigint(20)    NOT NULL AUTO_INCREMENT,
  `product_id`   bigint(20)    NOT NULL COMMENT '📌关联tb_product.id',
  `user_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `order_id`     bigint(20)    NOT NULL COMMENT '📌关联tb_order.id',
  `order_item_id` bigint(20)   NOT NULL COMMENT '📌关联tb_order_item.id',
  `rating`       tinyint(4)    NOT NULL COMMENT '评分(1-5)',
  `content`      text          DEFAULT NULL,
  `images`       varchar(2000) DEFAULT NULL COMMENT '图片(JSON数组)',
  `is_anonymous` tinyint(1)    DEFAULT '0',
  `status`       tinyint(4)    DEFAULT '1' COMMENT '0管理员删除 1正常 2待审核',
  `reply_content` text         DEFAULT NULL COMMENT '商家回复',
  `reply_time`   datetime      DEFAULT NULL,
  `is_top`       tinyint(4)    DEFAULT '0' COMMENT '是否置顶',
  `top_time`     datetime      DEFAULT NULL COMMENT '置顶时间(多条置顶按此排序)',
  `report_count` int(11)       DEFAULT '0' COMMENT '被举报次数,达3次自动转待审核',
  `create_time`  datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted`      tinyint(1)    DEFAULT '0' COMMENT '用户自己删除(@TableLogic)',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品评价表';

-- =============================================
-- ⑪ 评价举报记录表 ✅
-- =============================================
CREATE TABLE `tb_review_report` (
  `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
  `review_id`   bigint(20)   NOT NULL COMMENT '📌关联tb_review.id',
  `user_id`     bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `reason`      varchar(255) DEFAULT '',
  `create_time` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_user` (`review_id`, `user_id`) COMMENT '防重复举报'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价举报记录表';

-- =============================================
-- ⑫ 管理员操作日志表 ✅
-- =============================================
CREATE TABLE `tb_admin_log` (
  `id`           bigint(20)   NOT NULL AUTO_INCREMENT,
  `admin_id`     bigint(20)   NOT NULL COMMENT '📌关联tb_user.id(role=1)',
  `admin_name`   varchar(50)  NOT NULL,
  `operation`    varchar(100) NOT NULL COMMENT '操作类型',
  `method`       varchar(200) DEFAULT NULL,
  `params`       text         COMMENT '请求参数',
  `ip_address`   varchar(50)  DEFAULT NULL,
  `status`       tinyint(4)   DEFAULT '1' COMMENT '0-失败 1-成功',
  `execution_time` bigint(20) DEFAULT NULL COMMENT '执行耗时(ms)',
  `error_msg`    text         DEFAULT NULL,
  `user_agent`   varchar(500) DEFAULT NULL,
  `create_time`  datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_operation` (`operation`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';

-- =============================================
-- ⑬ 商品调整日志表 ✅
-- =============================================
CREATE TABLE `tb_product_log` (
  `id`              bigint(20)   NOT NULL AUTO_INCREMENT,
  `product_id`      bigint(20)   NOT NULL COMMENT '📌关联tb_product.id',
  `product_name`    varchar(200) NOT NULL COMMENT '商品名称快照',
  `operation_type`  varchar(50)  NOT NULL COMMENT '新增/修改/上架/下架/删除',
  `change_fields`   text         DEFAULT NULL COMMENT '变更字段详情(JSON)',
  `operator_id`     bigint(20)   NOT NULL COMMENT '操作人ID',
  `operator_name`   varchar(50)  DEFAULT NULL,
  `ip_address`      varchar(50)  DEFAULT NULL,
  `create_time`     datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品调整日志表';

-- =============================================
-- ⑭ 库存调整日志表 ✅
-- =============================================
CREATE TABLE `tb_stock_log` (
  `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
  `product_id`    bigint(20)   NOT NULL COMMENT '📌关联tb_product.id',
  `product_name`  varchar(200) NOT NULL COMMENT '商品名称快照',
  `before_stock`  int(11)      NOT NULL COMMENT '调整前库存',
  `change_amount` int(11)      NOT NULL COMMENT '变动数量(正=增加 负=减少)',
  `after_stock`   int(11)      NOT NULL COMMENT '调整后库存',
  `reason`        varchar(200) DEFAULT NULL COMMENT '调整原因',
  `operator_id`   bigint(20)   NOT NULL COMMENT '操作人ID',
  `operator_name` varchar(50)  DEFAULT NULL,
  `create_time`   datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存调整日志表';

-- =============================================
-- ⑮ 消息通知表 ✅
-- =============================================
CREATE TABLE `tb_notification` (
  `id`           bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`      bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `module`       varchar(50)  NOT NULL COMMENT '所属模块(mall/forum/course/location/system等)',
  `type`         varchar(50)  NOT NULL COMMENT '通知类型',
  `title`        varchar(200) NOT NULL COMMENT '通知标题',
  `content`      text         NOT NULL COMMENT '通知内容',
  `is_read`      tinyint(1)   DEFAULT '0' COMMENT '0-未读 1-已读',
  `read_time`    datetime     DEFAULT NULL,
  `related_id`   bigint(20)   DEFAULT NULL COMMENT '关联业务ID',
  `related_type` varchar(50)  DEFAULT NULL COMMENT '关联业务类型',
  `jump_url`     varchar(500) DEFAULT NULL COMMENT '点击跳转URL',
  `priority`     tinyint(4)   DEFAULT '0' COMMENT '0-普通 1-重要 2-紧急',
  `extra_data`   text         DEFAULT NULL COMMENT '额外数据(JSON)',
  `deleted`      tinyint(1)   DEFAULT '0',
  `create_time`  datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表';

-- =============================================
-- ⑯ 通知模板表 ✅
-- =============================================
CREATE TABLE `tb_notification_template` (
  `id`                  bigint(20)   NOT NULL AUTO_INCREMENT,
  `code`                varchar(100) NOT NULL COMMENT '模板唯一编码',
  `module`              varchar(50)  NOT NULL COMMENT '所属模块',
  `type`                varchar(50)  NOT NULL COMMENT '通知类型',
  `title_template`      varchar(200) NOT NULL COMMENT '标题模板(支持{变量})',
  `content_template`    text         NOT NULL COMMENT '内容模板(支持{变量})',
  `jump_url_template`   varchar(500) DEFAULT NULL COMMENT '跳转URL模板',
  `variables`           text         DEFAULT NULL COMMENT '变量说明(JSON)',
  `enabled`             tinyint(1)   DEFAULT '1' COMMENT '0-禁用 1-启用',
  `remark`              varchar(200) DEFAULT NULL,
  `create_time`         datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`         datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知模板表';

-- =============================================
-- ⑰ 用户通知设置表 ✅
-- =============================================
CREATE TABLE `tb_user_notification_setting` (
  `id`          bigint(20)  NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20)  NOT NULL COMMENT '📌关联tb_user.id',
  `module`      varchar(50) NOT NULL,
  `type`        varchar(50) NOT NULL,
  `enabled`     tinyint(1)  DEFAULT '1',
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_module_type` (`user_id`, `module`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户通知设置表';

-- =============================================
-- ⑱ 系统设置表 ✅
-- =============================================
CREATE TABLE `tb_system_setting` (
  `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
  `group_name`    varchar(50)  NOT NULL COMMENT '设置分组(basic/freight/payment等)',
  `setting_key`   varchar(100) NOT NULL COMMENT '设置键',
  `setting_value` text         DEFAULT NULL COMMENT '设置值',
  `value_type`    varchar(20)  DEFAULT 'string' COMMENT '值类型(string/integer/decimal/boolean)',
  `description`   varchar(200) DEFAULT NULL,
  `create_time`   datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_key` (`group_name`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置键值对表';

-- 初始化默认数据
INSERT INTO `tb_system_setting` (`group_name`, `setting_key`, `setting_value`, `value_type`, `description`) VALUES
('basic', 'mall_name',            '天文器材商城',        'string',  '商城名称'),
('basic', 'mall_logo',            '',                    'string',  'Logo URL'),
('basic', 'mall_desc',            '专业天文器材购买平台', 'string',  '商城简介'),
('basic', 'contact_phone',        '',                    'string',  '客服电话'),
('basic', 'contact_email',        '',                    'string',  '客服邮箱'),
('basic', 'contact_qq',           '',                    'string',  '客服QQ'),
('basic', 'icp_number',           '',                    'string',  'ICP备案号'),
('basic', 'copyright',            '© 2026 天文器材商城', 'string',  '版权信息'),
('freight', 'default_freight',    '10',                  'decimal', '默认运费(元)'),
('freight', 'free_freight_enabled','true',               'boolean', '是否满额包邮'),
('freight', 'free_freight_amount','99',                  'decimal', '包邮门槛金额'),
('payment', 'alipay_enabled',     'true',                'boolean', '支付宝开关'),
('payment', 'wechat_enabled',     'true',                'boolean', '微信支付开关'),
('payment', 'balance_enabled',    'true',                'boolean', '余额支付开关'),
('payment', 'pay_timeout_minutes','15',                  'integer', '支付超时(分钟)'),
('payment', 'auto_confirm_days',  '7',                   'integer', '自动确认收货天数'),
('payment', 'auto_close_days',    '3',                   'integer', '超时未付自动关闭天数'),
('seo', 'seo_title',              '天文器材商城',        'string',  '网站标题'),
('seo', 'seo_keywords',           '天文望远镜,天文器材', 'string',  '关键词'),
('seo', 'seo_description',        '专业天文器材平台',    'string',  '网站描述'),
('register', 'register_enabled',  'true',                'boolean', '是否开放注册'),
('register', 'email_verify_enabled','false',             'boolean', '是否邮箱验证'),
('register', 'invite_only',       'false',               'boolean', '是否邀请制'),
('register', 'default_avatar',    'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png','string','默认头像'),
('maintenance', 'maintenance_mode',   'false',           'boolean', '维护模式开关'),
('maintenance', 'maintenance_message','系统维护中,请稍后', 'string', '维护提示语'),
('maintenance', 'maintenance_end_time','',               'string',  '预计恢复时间');

-- =============================================
-- ⑲ 收货地址表 ✅
-- =============================================
-- 说明: tb_order.receiver_* 字段存地址快照,删地址不影响历史订单
-- =============================================
CREATE TABLE `tb_address` (
  `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `receiver`    varchar(50)  NOT NULL COMMENT '收货人姓名',
  `phone`       varchar(20)  NOT NULL,
  `province`    varchar(50)  NOT NULL,
  `city`        varchar(50)  NOT NULL,
  `district`    varchar(50)  DEFAULT NULL,
  `address`     varchar(200) NOT NULL COMMENT '详细地址',
  `is_default`  tinyint(1)   DEFAULT '0' COMMENT '是否默认(同用户只有1条=1)',
  `create_time` datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- =============================================
-- ⑳ 余额流水表 ✅
-- =============================================
-- 说明: 所有余额变动必须通过BalanceService统一入口,严禁直接UPDATE
-- =============================================
CREATE TABLE `tb_balance_log` (
  `id`             bigint(20)    NOT NULL AUTO_INCREMENT,
  `user_id`        bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `type`           tinyint(4)    NOT NULL COMMENT '1充值 2提现 3回收入账 4购物扣款',
  `amount`         decimal(10,2) NOT NULL COMMENT '变动金额(正数=入账 负数=支出)',
  `balance_before` decimal(10,2) NOT NULL COMMENT '变动前余额',
  `balance_after`  decimal(10,2) NOT NULL COMMENT '变动后余额',
  `remark`         varchar(200)  DEFAULT NULL,
  `related_id`     bigint(20)    DEFAULT NULL COMMENT '关联业务ID',
  `related_type`   varchar(50)   DEFAULT NULL COMMENT '关联业务类型',
  `create_time`    datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='余额流水表';

-- =============================================
-- ㉑ 安装预约表 ✅
-- =============================================
-- 状态: 0待确认 1已确认 2已取消
-- =============================================
CREATE TABLE `tb_installation` (
  `id`               bigint(20)    NOT NULL AUTO_INCREMENT,
  `user_id`          bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `order_id`         bigint(20)    NOT NULL COMMENT '📌关联tb_order.id',
  `product_name`     varchar(200)  NOT NULL COMMENT '器材名称快照',
  `receiver_name`    varchar(50)   DEFAULT NULL COMMENT '收货人快照',
  `receiver_phone`   varchar(20)   DEFAULT NULL,
  `receiver_address` varchar(300)  DEFAULT NULL COMMENT '安装地址快照',
  `expected_time`    datetime      DEFAULT NULL COMMENT '期望安装时间',
  `remark`           varchar(500)  DEFAULT NULL,
  `status`           tinyint(4)    DEFAULT '0' COMMENT '0待确认 1已确认 2已取消',
  `confirmed_time`   datetime      DEFAULT NULL COMMENT '确认的安装时间',
  `engineer_name`    varchar(50)   DEFAULT NULL,
  `engineer_phone`   varchar(20)   DEFAULT NULL,
  `cancel_reason`    varchar(200)  DEFAULT NULL,
  `admin_id`         bigint(20)    DEFAULT NULL,
  `create_time`      datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`      datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安装预约表';

-- =============================================
-- ㉒ 器材保养提醒表 ✅
-- =============================================
CREATE TABLE `tb_service_reminder` (
  `id`            bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`       bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `product_name`  varchar(200) NOT NULL COMMENT '器材名称(用户自填)',
  `remind_type`   varchar(20)  DEFAULT 'custom' COMMENT 'clean/calibrate/check/custom',
  `remind_title`  varchar(100) NOT NULL,
  `remind_date`   date         NOT NULL COMMENT '提醒日期',
  `is_done`       tinyint(4)   DEFAULT '0' COMMENT '0-未完成 1-已完成',
  `done_time`     datetime     DEFAULT NULL,
  `create_time`   datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_remind_date` (`remind_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='器材保养提醒表';

-- =============================================
-- ㉓ 二手回收申请表 ✅
-- =============================================
-- 状态: 0待审核 1已报价 2用户确认 3待取件 4已回收 5已拒绝 6用户取消
-- 成色: S全新 A九成新 B七八成新 C六成以下
-- =============================================
CREATE TABLE `tb_recycling` (
  `id`                bigint(20)    NOT NULL AUTO_INCREMENT,
  `recycle_no`        varchar(32)   NOT NULL COMMENT '回收单号',
  `user_id`           bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `product_name`      varchar(200)  NOT NULL,
  `brand`             varchar(100)  DEFAULT NULL,
  `model`             varchar(100)  DEFAULT NULL,
  `condition_level`   varchar(5)    NOT NULL COMMENT '成色(S/A/B/C)',
  `description`       varchar(1000) DEFAULT NULL,
  `images`            mediumtext    DEFAULT NULL COMMENT '实拍图(base64 JSON数组,最多6张)',
  `assessed_price`    decimal(10,2) DEFAULT NULL COMMENT '管理员报价金额',
  `admin_remark`      varchar(500)  DEFAULT NULL COMMENT '报价备注/拒绝原因',
  `logistics_company` varchar(100)  DEFAULT NULL COMMENT '取件快递公司',
  `tracking_number`   varchar(100)  DEFAULT NULL,
  `status`            tinyint(4)    DEFAULT '0',
  `confirm_time`      datetime      DEFAULT NULL COMMENT '用户确认时间',
  `complete_time`     datetime      DEFAULT NULL COMMENT '回收完成时间',
  `admin_id`          bigint(20)    DEFAULT NULL,
  `create_time`       datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`       datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_recycle_no` (`recycle_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二手回收申请表';

-- =============================================
-- ㉔ 商品收藏表 ✅
-- =============================================
CREATE TABLE `tb_product_favorite` (
  `id`           bigint(20)    NOT NULL AUTO_INCREMENT,
  `user_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `product_id`   bigint(20)    NOT NULL COMMENT '📌关联tb_product.id',
  `price_when_favorited` decimal(10,2) DEFAULT NULL COMMENT '收藏时价格快照(用于涨跌对比)',
  `create_time`  datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';

-- =============================================
-- ㉕ AI星图识别记录表 ✅
-- =============================================
-- 注意: dec字段是MySQL保留关键字,Java实体必须加@TableField("`dec`")注解
-- =============================================
CREATE TABLE `tb_recognition` (
  `id`                   bigint(20)    NOT NULL AUTO_INCREMENT,
  `user_id`              bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `image_data`           mediumtext    DEFAULT NULL COMMENT '原始星图base64',
  `image_url`            varchar(500)  DEFAULT NULL COMMENT '图片URL',
  `submission_id`        varchar(50)   DEFAULT NULL COMMENT 'Astrometry submission_id',
  `job_id`               varchar(50)   DEFAULT NULL COMMENT 'Astrometry job_id',
  `status`               tinyint(4)    DEFAULT 0 COMMENT '0识别中 1成功 2失败',
  `ra`                   double        DEFAULT NULL COMMENT '赤经',
  `dec`                  double        DEFAULT NULL COMMENT '赤纬 ⚠️MySQL保留关键字',
  `orientation`          double        DEFAULT NULL COMMENT '方向角(度)',
  `radius`               decimal(8,4)  DEFAULT NULL COMMENT '视野半径(度)',
  `machine_tags`         text          DEFAULT NULL COMMENT 'Astrometry返回的机器标签(JSON)',
  `objects_in_field`     text          DEFAULT NULL COMMENT '识别到的天体列表(JSON)',
  `result_image_url`     varchar(500)  DEFAULT NULL COMMENT '标注图片URL',
  `recommended_products` text          COMMENT '推荐商品ID列表(JSON数组)',
  `fail_reason`          varchar(200)  DEFAULT NULL,
  `create_time`          datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`          datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI星图识别记录表';

-- =============================================
-- ㉖ 课程主表 ✅
-- =============================================
-- 重要字段:
--   type: 0-视频课 1-书本课
--   is_apod_course: APOD专属课,APODSyncScheduler每天凌晨2点自动同步章节
--   is_mars_course: 火星日志课,MarsRoverSyncScheduler每天凌晨2:30同步
--   tags: 与tb_product.tags格式一致,用于购买商品后推荐相关课程
-- =============================================
CREATE TABLE `tb_course` (
  `id`              bigint(20)   NOT NULL AUTO_INCREMENT,
  `title`           varchar(200) NOT NULL COMMENT '课程标题',
  `subtitle`        varchar(300) DEFAULT NULL,
  `cover`           varchar(500) DEFAULT NULL COMMENT '封面图URL',
  `type`            tinyint(4)   NOT NULL DEFAULT 0 COMMENT '0-视频课 1-书本课',
  `difficulty`      tinyint(4)   DEFAULT 1 COMMENT '1入门 2进阶 3高级',
  `chapter_count`   int(11)      DEFAULT 0 COMMENT '章节总数(冗余)',
  `tags`            varchar(500) DEFAULT NULL COMMENT '课程标签(JSON数组) 📌推荐系统',
  `is_apod_course`  tinyint(1)   DEFAULT 0 COMMENT 'NASA APOD专属课(每天自动增章节)',
  `is_mars_course`  tinyint(1)   DEFAULT 0 COMMENT '火星日志课(每天自动增章节)',
  `status`          tinyint(4)   DEFAULT 0 COMMENT '0-草稿 1-已发布',
  `sort`            int(11)      DEFAULT 0 COMMENT '排序',
  `create_time`     datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`     datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted`         tinyint(1)   DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程主表';

-- =============================================
-- ㉗ 课程章节表 ✅
-- =============================================
-- 重要字段:
--   video_url: 始终存完整嵌入URL(前端直接用,无需转换)
--   source: manual手动 / apod NASA同步 / mars_rover 火星车同步
--   apod_date: 去重用(防止同一天重复同步)
--   content: MEDIUMTEXT(上限16MB,支持base64图片)
-- =============================================
CREATE TABLE `tb_course_chapter` (
  `id`           bigint(20)    NOT NULL AUTO_INCREMENT,
  `course_id`    bigint(20)    NOT NULL COMMENT '📌关联tb_course.id',
  `title`        varchar(200)  NOT NULL COMMENT '章节标题',
  `type`         tinyint(4)    DEFAULT 0 COMMENT '0-视频 1-书本',
  `video_url`    varchar(500)  DEFAULT NULL COMMENT '完整嵌入URL(YouTube/B站/抖音)',
  `content`      mediumtext    DEFAULT NULL COMMENT '富文本内容(MEDIUMTEXT支持base64图片)',
  `duration`     int(11)       DEFAULT NULL COMMENT '视频时长(秒)',
  `sort`         int(11)       DEFAULT 0 COMMENT '排序',
  `source`       varchar(20)   DEFAULT 'manual' COMMENT 'manual/apod/mars_rover',
  `apod_date`    date          DEFAULT NULL COMMENT 'APOD同步日期(去重,兼容存earthDate)',
  `apod_image`   varchar(500)  DEFAULT NULL COMMENT 'APOD/火星车图片URL',
  `create_time`  datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程章节表';

-- =============================================
-- ㉘ 课程学习进度表 ✅
-- =============================================
-- 说明: 替代原tb_user_course,记录last_chapter_id+completed_chapters JSON
-- APOD课/火星课不触发完课通知(每天自动增章节,永远追不上)
-- =============================================
CREATE TABLE `tb_course_progress` (
  `id`                  bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`             bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `course_id`           bigint(20)   NOT NULL COMMENT '📌关联tb_course.id',
  `last_chapter_id`     bigint(20)   DEFAULT NULL COMMENT '上次学习的章节ID',
  `last_learn_time`     datetime     DEFAULT NULL,
  `completed_chapters`  text         DEFAULT NULL COMMENT '已完成章节ID列表(JSON数组)',
  `create_time`         datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`         datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程学习进度表';

-- =============================================
-- ㉙ 课程收藏表 ✅
-- =============================================
CREATE TABLE `tb_course_favorite` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20) NOT NULL COMMENT '📌关联tb_user.id',
  `course_id`   bigint(20) NOT NULL COMMENT '📌关联tb_course.id',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程收藏表';

-- =============================================
-- ㉚ 课程评价表 ✅ (5.6已激活)
-- =============================================
-- 重要: 无deleted字段,用status=0做软删除,不能用@TableLogic
-- avgRating/reviewCount通过子查询实时计算,不存tb_course表
-- =============================================
CREATE TABLE `tb_course_review` (
  `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
  `course_id`   bigint(20)   NOT NULL COMMENT '📌关联tb_course.id',
  `user_id`     bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `rating`      tinyint(4)   NOT NULL COMMENT '评分(1-5)',
  `content`     varchar(500) DEFAULT NULL COMMENT '评价内容(最多500字)',
  `status`      tinyint(4)   DEFAULT 1 COMMENT '0-管理员删除 1-正常',
  `create_time` datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程评价表(status=0软删除,无deleted字段)';

-- =============================================
-- ㉛ 天文观测点表 ✅ (6.0已创建 2026-03-23)
-- =============================================
-- 关联: tb_user_checkin(spot_id) / tb_spot_rating(spot_id)
-- Bortle等级: 1-9,数字越小越暗越好(1=最佳天空/9=城市天空)
-- =============================================
CREATE TABLE `tb_observation_spot` (
  `id`                    bigint(20)    NOT NULL AUTO_INCREMENT COMMENT '观测点ID',
  `spot_name`             varchar(100)  NOT NULL COMMENT '观测点名称',
  `longitude`             decimal(10,7) NOT NULL COMMENT '经度 📌高德坐标系GCJ-02',
  `latitude`              decimal(10,7) NOT NULL COMMENT '纬度 📌高德坐标系GCJ-02',
  `province`              varchar(50)   DEFAULT NULL,
  `city`                  varchar(50)   DEFAULT NULL,
  `address`               varchar(200)  DEFAULT NULL COMMENT '详细地址',
  `altitude`              int(11)       DEFAULT 0 COMMENT '海拔(米)',
  `light_pollution_level` tinyint(4)    DEFAULT 5 COMMENT 'Bortle等级(1-9,越小越暗越好)',
  `rating`                decimal(3,2)  DEFAULT 0.00 COMMENT '综合评分(0-5)',
  `rating_count`          int(11)       DEFAULT 0 COMMENT '评分人数(冗余,与tb_spot_rating同步)',
  `description`           text          DEFAULT NULL COMMENT '观测点描述(地形/交通/注意事项)',
  `images`                text          DEFAULT NULL COMMENT '图片URL列表(JSON数组)',
  `checkin_count`         int(11)       DEFAULT 0 COMMENT '总签到次数(冗余)',
  `deleted`               tinyint(1)    DEFAULT 0 COMMENT '逻辑删除',
  `create_time`           datetime      DEFAULT CURRENT_TIMESTAMP,
  `update_time`           datetime      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_location` (`longitude`, `latitude`),
  KEY `idx_province_city` (`province`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='天文观测点表';

-- =============================================
-- ㉜ 用户签到记录表 ✅ (6.0已创建 2026-03-23)
-- =============================================
-- 每个观测点每天限签1次(UNIQUE约束保证)
-- weather/moon_phase: 签到时快照,方便足迹页展示
-- =============================================
CREATE TABLE `tb_user_checkin` (
  `id`           bigint(20)    NOT NULL AUTO_INCREMENT,
  `user_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_user.id',
  `spot_id`      bigint(20)    NOT NULL COMMENT '📌关联tb_observation_spot.id',
  `longitude`    decimal(10,7) DEFAULT NULL COMMENT '签到时用户坐标经度',
  `latitude`     decimal(10,7) DEFAULT NULL COMMENT '签到时用户坐标纬度',
  `weather`      varchar(50)   DEFAULT NULL COMMENT '签到时天气快照(如"晴")',
  `moon_phase`   varchar(20)   DEFAULT NULL COMMENT '签到时月相快照(如"新月")',
  `checkin_date` date          NOT NULL COMMENT '签到日期(每日去重依据)',
  `create_time`  datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_spot_date` (`user_id`, `spot_id`, `checkin_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_spot_id` (`spot_id`),
  KEY `idx_checkin_date` (`checkin_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户观测点签到记录表';

-- =============================================
-- ㉝ 观测点评分记录表 ✅ (6.0已创建 2026-03-23)
-- =============================================
-- UNIQUE约束防止重复评分,每人每个观测点只能评一次
-- 每次评分后同步更新 tb_observation_spot.rating 和 rating_count
-- =============================================
CREATE TABLE `tb_spot_rating` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20) NOT NULL COMMENT '📌关联tb_user.id',
  `spot_id`     bigint(20) NOT NULL COMMENT '📌关联tb_observation_spot.id',
  `score`       tinyint(4) NOT NULL COMMENT '评分(1-5星)',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_spot` (`user_id`, `spot_id`) COMMENT '每人每个观测点限评一次',
  KEY `idx_spot_id` (`spot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='观测点评分记录表';

-- =============================================
-- ㉞ 论坛帖子表 ✅ (7.1已创建 2026-03-27)
-- =============================================
-- 状态: 0草稿 1审核中 2已发布 3已拒绝 4管理员删除
-- deleted: @TableLogic,用户自己删除
-- hot_score: ForumScheduler每小时计算=(likes×1+comments×2+collects×3)/(天数+2)^1.5
-- ⚠️ 7.7.x (2026-04-08) is_top 字段语义重新定位:
--   原: "置顶"（用户列表 ORDER BY p.is_top DESC，但小红书瀑布流下视觉无效果）
--   新: "管理员推荐信号"（用户端不感知，8.x 推荐算法读取作为 hot_score 加权因子 ~1.5x-2x）
--   - DDL 不动，仅注释/服务层语义更新
--   - PostMapper.xml 用户列表已移除 is_top DESC 排序
--   - AdminPostService.toggleRecommendPost(原 toggleTopPost) 切换此字段
--   - ForumManage.vue 显示「加入推荐 / 取消推荐」标签
-- =============================================
CREATE TABLE `tb_post` (
  `id`             bigint(20)   NOT NULL AUTO_INCREMENT,
  `user_id`        bigint(20)   NOT NULL COMMENT '📌关联tb_user.id',
  `title`          varchar(200) NOT NULL,
  `content`        text         NOT NULL,
  `images`         mediumtext   DEFAULT NULL COMMENT '图片(base64 JSON数组,最多9张)',
  `tags`           varchar(500) DEFAULT NULL COMMENT '帖子标签(JSON数组) 📌推荐系统',
  `status`         tinyint(4)   DEFAULT 1 COMMENT '0草稿 1审核中 2已发布 3已拒绝 4管理员删除',
  `reject_reason`  varchar(200) DEFAULT NULL,
  `like_count`     int(11)      DEFAULT 0,
  `comment_count`  int(11)      DEFAULT 0,
  `collect_count`  int(11)      DEFAULT 0,
  `view_count`     int(11)      DEFAULT 0,
  `is_top`         tinyint(1)   DEFAULT 0 COMMENT '管理员推荐信号(7.7.x 重新定位,原"置顶")📌8.x推荐算法加权',
  `hot_score`      double       DEFAULT 0 COMMENT '热度分,每小时更新',
  `is_hot`         tinyint(1)   DEFAULT 0 COMMENT '是否热门(热度超阈值自动置1)',
  `recognition_id` bigint(20)   DEFAULT NULL COMMENT 'AI识别结果分享时关联 📌关联tb_recognition.id',
  `create_time`    datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`    datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted`        tinyint(1)   DEFAULT 0 COMMENT '@TableLogic用户自己删除',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_hot_score` (`hot_score`),
  KEY `idx_create_time` (`create_time`),
  FULLTEXT KEY `ft_post_search` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛帖子表';

-- =============================================
-- ㉟ 帖子评论表 ✅ (7.1已创建 2026-03-27)
-- =============================================
-- 两级评论: parent_id=0顶级,parent_id>0回复(始终指向顶级评论ID)
-- =============================================
CREATE TABLE `tb_post_comment` (
  `id`                bigint(20)  NOT NULL AUTO_INCREMENT,
  `post_id`           bigint(20)  NOT NULL COMMENT '📌关联tb_post.id',
  `user_id`           bigint(20)  NOT NULL COMMENT '📌关联tb_user.id',
  `parent_id`         bigint(20)  DEFAULT 0 COMMENT '0=顶级评论,>0=回复(始终指向顶级)',
  `reply_to_user_id`  bigint(20)  DEFAULT NULL COMMENT '被回复的用户ID 📌@通知依据',
  `reply_to_username` varchar(50) DEFAULT NULL COMMENT '被回复的用户名(冗余,前端显示@xxx用)',
  `content`           text        NOT NULL,
  `like_count`        int(11)     DEFAULT 0,
  `status`            tinyint(4)  DEFAULT 1 COMMENT '0管理员删除 1正常',
  `create_time`       datetime    DEFAULT CURRENT_TIMESTAMP,
  `deleted`           tinyint(1)  DEFAULT 0 COMMENT '@TableLogic用户自己删除',
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子评论表(两级)';

-- =============================================
-- ㊱ 帖子点赞表 ✅ (7.1已创建 2026-03-27)
-- =============================================
CREATE TABLE `tb_post_like` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `post_id`     bigint(20) NOT NULL COMMENT '📌关联tb_post.id',
  `user_id`     bigint(20) NOT NULL COMMENT '📌关联tb_user.id',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞表';

-- =============================================
-- ㊲ 帖子收藏表 ✅ (7.1已创建 2026-03-27)
-- =============================================
CREATE TABLE `tb_post_collect` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `post_id`     bigint(20) NOT NULL COMMENT '📌关联tb_post.id',
  `user_id`     bigint(20) NOT NULL COMMENT '📌关联tb_user.id',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子收藏表';

-- =============================================
-- ㊲-b 评论点赞表 ✅ (7.4已创建 2026-04-02)
-- =============================================
-- 与 tb_post_like 同模式: INSERT=点赞, DELETE=取消点赞
-- 唯一约束 uk_comment_user 防止重复点赞
-- =============================================
CREATE TABLE `tb_comment_like` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `comment_id`  bigint(20) NOT NULL COMMENT '📌关联tb_post_comment.id',
  `user_id`     bigint(20) NOT NULL COMMENT '📌关联tb_user.id',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_user` (`comment_id`, `user_id`),
  KEY `idx_comment_id` (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论点赞表';

-- =============================================
-- ㊳ 帖子图片表 ❌ 已砍掉 (v8.34)
-- =============================================
-- ⚠️ 不再创建此表，图片直接使用 tb_post.images JSON字段存储（与二手回收方案一致）
-- 理由: tb_post.images mediumtext JSON数组已完全满足需求，独立查询场景在毕设中不存在
-- CREATE TABLE `tb_post_image` ... （已移除）

-- =============================================
-- ㊴ 帖子标签表 ❌ 已砍掉 (v8.34)
-- =============================================
-- ⚠️ 不再创建此表，标签直接使用 tb_post.tags JSON字段存储
-- 理由: tb_post.tags varchar(500) JSON数组已满足推荐系统标签匹配需求
--       标签统计可通过解析JSON聚合实现，无需冗余表维护
-- CREATE TABLE `tb_post_tag` ... （已移除）

-- =============================================
-- ㊵ 用户关注关系表 ✅ (7.1已创建 2026-03-27)
-- =============================================
CREATE TABLE `tb_user_follow` (
  `id`          bigint(20) NOT NULL AUTO_INCREMENT,
  `follower_id` bigint(20) NOT NULL COMMENT '关注者ID 📌关联tb_user.id',
  `followed_id` bigint(20) NOT NULL COMMENT '被关注者ID 📌关联tb_user.id',
  `create_time` datetime   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follow` (`follower_id`, `followed_id`),
  KEY `idx_follower` (`follower_id`) COMMENT '查我关注的人',
  KEY `idx_followed` (`followed_id`) COMMENT '查关注我的人'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';

-- =============================================
-- ㊶ 搜索日志表 ✅ (7.1已创建 2026-03-27)
-- =============================================
-- @Async异步写入,Redis缓存热搜1小时,30天前记录定期清理
-- =============================================
CREATE TABLE `tb_search_log` (
  `id`          bigint(20)   NOT NULL AUTO_INCREMENT,
  `keyword`     varchar(100) NOT NULL,
  `user_id`     bigint(20)   DEFAULT NULL COMMENT '未登录时为null',
  `search_type` varchar(10)  DEFAULT 'post' COMMENT 'post-帖子/user-用户',
  `create_time` datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_keyword` (`keyword`) COMMENT '热门搜索GROUP BY查询',
  KEY `idx_create_time` (`create_time`) COMMENT '定期清理'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索日志表(Redis缓存热搜1小时,30天前记录定期清理)';

-- =============================================
-- ㊷ 商品浏览记录表 ✅ (8.0已创建 2026-04-11)
-- =============================================
-- Redis去重: SETNX "browse:dedup:{userId}:{productId}" TTL=1800s
-- CF权重: 浏览(1) + 收藏(2) + 购买(3)
-- 定时清理: 每周一凌晨3点DELETE WHERE browse_time < 90天前
-- =============================================
CREATE TABLE `tb_browse_log` (
  `id`          bigint(20)  NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20)  NOT NULL COMMENT '📌关联tb_user.id',
  `product_id`  bigint(20)  NOT NULL COMMENT '📌关联tb_product.id',
  `category_id` bigint(20)  DEFAULT NULL COMMENT '分类ID(冗余,加速按类推荐)',
  `source`      varchar(20) DEFAULT 'detail' COMMENT 'detail/list',
  `browse_time` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_time` (`user_id`, `browse_time`),
  KEY `idx_browse_time` (`browse_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品浏览记录表(推荐系统协同过滤数据源,30分钟Redis去重,90天清理)';

-- =============================================
-- ㊸ 帖子浏览记录表 ✅ (8.0已创建 2026-04-11)
-- =============================================
CREATE TABLE `tb_post_browse_log` (
  `id`          bigint(20)  NOT NULL AUTO_INCREMENT,
  `user_id`     bigint(20)  NOT NULL COMMENT '📌关联tb_user.id',
  `post_id`     bigint(20)  NOT NULL COMMENT '📌关联tb_post.id',
  `browse_time` datetime    NOT NULL,
  `duration`    int(11)     DEFAULT 0 COMMENT '浏览时长(秒)',
  `source`      varchar(50) DEFAULT NULL,
  `create_time` datetime    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_time` (`user_id`, `browse_time`),
  KEY `idx_browse_time` (`browse_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子浏览记录表';

-- =============================================
-- ㊹ 推荐配置表 ⬜ (第16周,可选)
-- =============================================
CREATE TABLE `tb_recommend_config` (
  `id`           bigint(20)   NOT NULL AUTO_INCREMENT,
  `config_key`   varchar(100) NOT NULL COMMENT '配置键(如content_weight)',
  `config_value` varchar(500) NOT NULL,
  `config_type`  varchar(50)  NOT NULL COMMENT 'product/course/post',
  `description`  varchar(200) DEFAULT NULL,
  `create_time`  datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key_type` (`config_key`, `config_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐系统配置表';

-- =============================================
-- ㊺ 推荐记录表 ✅ (8.0已创建 2026-04-11，答辩展示曝光/点击率)
-- =============================================
CREATE TABLE `tb_recommend_record` (
  `id`              bigint(20)  NOT NULL AUTO_INCREMENT,
  `user_id`         bigint(20)  NOT NULL COMMENT '📌关联tb_user.id',
  `recommend_type`  varchar(50) NOT NULL COMMENT 'product/course/post',
  `target_id`       bigint(20)  NOT NULL,
  `algorithm`       varchar(50) NOT NULL COMMENT 'content/collaborative/hot',
  `score`           double      DEFAULT NULL,
  `position`        int(11)     DEFAULT NULL COMMENT '推荐位置(1-10)',
  `is_clicked`      tinyint(4)  DEFAULT 0,
  `click_time`      datetime    DEFAULT NULL,
  `create_time`     datetime    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_recommend_type` (`recommend_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐记录表';

-- =============================================
-- 表状态总览
-- =============================================
/*
已创建(44张) — SHOW TABLES 实测对齐，2026-04-16 v8.60 校对:
  用户相关(2):   tb_user ✅ / tb_login_log ✅
  商城商品(3):   tb_category ✅ / tb_product ✅ / tb_cart ✅
  订单支付(4):   tb_order ✅ / tb_order_item ✅ / tb_payment ✅ / tb_refund ✅
  评价举报(3):   tb_review ✅ / tb_review_like ✅ / tb_review_report ✅
  后台管理(4):   tb_admin_log ✅ / tb_product_log ✅ / tb_stock_log ✅ / tb_system_setting ✅
  通知系统(3):   tb_notification ✅ / tb_notification_template ✅(35条模板) / tb_user_notification_setting ✅
  个人空间(2):   tb_address ✅ / tb_balance_log ✅
  售后服务(3):   tb_installation ✅ / tb_service_reminder ✅ / tb_recycling ✅
  商品收藏(1):   tb_product_favorite ✅
  AI识别(1):     tb_recognition ✅
  课程模块(5):   tb_course ✅ / tb_course_chapter ✅ / tb_course_progress ✅
                 tb_course_favorite ✅ / tb_course_review ✅(5.6已激活)
  地理位置(3):   tb_observation_spot ✅ / tb_user_checkin ✅ / tb_spot_rating ✅ (6.0已创建 2026-03-23)
  论坛模块(7):   tb_post ✅ / tb_post_comment ✅ / tb_post_like ✅ / tb_post_collect ✅
                 tb_comment_like ✅ (7.4已创建 2026-04-02)
                 tb_user_follow ✅ / tb_search_log ✅ (7.1已创建 2026-03-27)
                 ❌ tb_post_image/tb_post_tag 已砍掉(v8.34,用JSON字段替代避免多表JOIN)
  推荐系统(3):   tb_browse_log ✅ / tb_post_browse_log ✅ / tb_recommend_record ✅ (8.0已创建 2026-04-11)
  ─────────────────────────────────────────────
  合计: 2+3+4+3+4+3+2+3+1+1+5+3+7+3 = 44 ✅

可选未建(2张) — demo 场景无需建,答辩口径统一:
  tb_recommend_config  ⬜ CF 权重直接用 application.yml 的 recommend.* 配置项,避免动态查表开销
  tb_course_browse_log ⬜ 课程浏览埋点可复用 tb_browse_log,无独立建表必要

早期规划砍掉(2张) — v8.34 架构调整:
  tb_post_image ❌ 改用 tb_post.images varchar(2000) JSON 数组存 URL (JSON_EXTRACT 可查)
  tb_post_tag   ❌ 改用 tb_post.tags   varchar(500)  JSON 数组存标签 (与商品/课程标签体系一致)

答辩口径: 早期规划 48 − 砍掉 2 − 可选未建 2 = 实际 44 张 ✅
*/

-- =============================================
-- 通知模板初始化数据 (已执行,共24个)
-- =============================================
INSERT INTO `tb_notification_template`
  (`code`,`module`,`type`,`title_template`,`content_template`,`jump_url_template`,`variables`,`enabled`,`remark`)
VALUES
-- 商城订单通知(5个) ✅
('MALL_ORDER_PAID','mall','order_paid','订单支付成功',
 '您的订单{orderNo}已支付成功,金额¥{amount}',
 '/order/detail?id={orderId}','{"orderNo":"订单号","amount":"金额","orderId":"订单ID"}',1,'订单支付成功通知'),
('MALL_ORDER_SHIPPED','mall','order_shipped','订单已发货',
 '您的订单{orderNo}已通过{logisticsCompany}发货,快递单号:{trackingNumber}',
 '/order/detail?id={orderId}','{"orderNo":"订单号","logisticsCompany":"物流公司","trackingNumber":"快递单号","orderId":"订单ID"}',1,'订单发货通知'),
('MALL_ORDER_DELIVERING','mall','order_delivering','订单派送中',
 '您的包裹正在派送中,请保持手机畅通,快递单号:{trackingNumber}',
 '/order/detail?id={orderId}','{"trackingNumber":"快递单号","orderId":"订单ID"}',1,'订单派送中通知'),
('MALL_ORDER_COMPLETED','mall','order_completed','订单已完成',
 '订单{orderNo}已完成,期待您的评价~',
 '/order/detail?id={orderId}','{"orderNo":"订单号","orderId":"订单ID"}',1,'订单完成通知'),
('MALL_ORDER_CANCELLED','mall','order_cancelled','订单已取消',
 '订单{orderNo}已取消,退款将在1-3个工作日内原路返回',
 '/order/detail?id={orderId}','{"orderNo":"订单号","orderId":"订单ID"}',1,'订单取消通知'),

-- 退款通知(3个) ✅
('MALL_REFUND_APPROVED','mall','refund_approved','退款审核通过',
 '您的退款申请已通过审核,退款金额¥{amount}将在1-3个工作日内到账',
 '/order/detail/{orderId}','{"amount":"退款金额","orderId":"订单ID"}',1,'退款审核通过通知'),
('MALL_REFUND_REJECTED','mall','refund_rejected','退款审核拒绝',
 '您的退款申请未通过审核,原因:{reason}',
 '/order/detail/{orderId}','{"reason":"拒绝原因","orderId":"订单ID"}',1,'退款审核拒绝通知'),
('MALL_REFUND_COMPLETED','mall','refund_completed','退款已到账',
 '退款金额¥{amount}已到账,请查收',
 '/order/detail/{orderId}','{"amount":"退款金额","orderId":"订单ID"}',1,'退款到账通知'),

-- 商品收藏通知(2个) ✅
('MALL_PRODUCT_ON_SALE','mall','product_on_sale','商品上架提醒',
 '您关注的商品"{productName}"已上架',
 '/product/detail?id={productId}','{"productName":"商品名称","productId":"商品ID"}',1,'商品上架通知'),
('MALL_PRODUCT_PRICE_DOWN','mall','product_price_down','商品降价提醒',
 '您关注的商品"{productName}"降价啦!现价¥{price}',
 '/product/detail?id={productId}','{"productName":"商品名称","price":"现价","productId":"商品ID"}',1,'商品降价通知'),

-- 系统通知(4个) ✅
('SYSTEM_ANNOUNCEMENT','system','announcement','系统公告',
 '{title}','/notice/detail?id={noticeId}','{"title":"公告标题","noticeId":"公告ID"}',1,'系统公告通知'),
('SYSTEM_SECURITY','system','security','账号安全',
 '{message}','/user/security','{"message":"安全提示内容"}',1,'账号安全通知'),
('SYSTEM_VERSION_UPDATE','system','version_update','版本更新',
 '发现新版本v{version},{description}',NULL,'{"version":"版本号","description":"更新说明"}',1,'版本更新通知'),
('SYSTEM_PROMOTION','system','promotion','活动推广',
 '{title}','/activity/detail?id={activityId}','{"title":"活动标题","activityId":"活动ID"}',1,'活动推广通知'),

-- 售后服务通知(3个) ✅ 已执行INSERT
('MALL_INSTALLATION_CONFIRMED','mall','installation_confirmed','安装预约已确认',
 '您的安装预约已确认，工程师{engineerName}将于{confirmedTime}上门，联系方式:{engineerPhone}',
 '/after-sale/installation','{"engineerName":"工程师姓名","confirmedTime":"确认时间","engineerPhone":"工程师电话"}',1,'安装预约确认通知'),
('MALL_INSTALLATION_CANCELLED','mall','installation_cancelled','安装预约已取消',
 '您的安装预约已被取消，原因：{reason}',
 '/after-sale/installation','{"reason":"取消原因"}',1,'安装预约取消通知'),
('MALL_RECYCLING_COMPLETED','mall','recycling_completed','二手回收款已到账',
 '您的回收申请{recycleNo}已完成，¥{amount}已到账至您的钱包！',
 '/user/wallet','{"recycleNo":"回收单号","amount":"到账金额"}',1,'二手回收款到账通知'),

-- AI识别通知(2个) ✅ 已执行INSERT
('AI_RECOGNITION_COMPLETED','ai','recognition_completed','星图识别完成',
 '您的星图已识别成功！发现天体：{objectNames}，快来查看吧',
 '/recognition/result?id={recognitionId}','{"objectNames":"天体名称","recognitionId":"识别记录ID"}',1,'星图识别成功通知'),
('AI_RECOGNITION_FAILED','ai','recognition_failed','星图识别失败',
 '您的星图识别未能成功，原因：{failReason}。请尝试上传更清晰的图片',
 '/recognition/history','{"failReason":"失败原因"}',1,'星图识别失败通知'),

-- 课程通知(3个) ✅ 已执行INSERT (2026-03-22)
('COURSE_CHAPTER_ADDED','course','chapter_added','课程更新了新章节',
 '您收藏的课程《{courseTitle}》新增了章节：{chapterTitle}，快去学习吧！',
 '/course/{courseId}','{"courseTitle":"课程标题","chapterTitle":"章节标题","courseId":"课程ID"}',1,'课程新增章节通知'),
('COURSE_APOD_UPDATED','course','apod_updated','NASA天文图片课更新了',
 '今日NASA天文图片「{apodTitle}」已更新到课程中，快去看看吧！',
 '/course/{courseId}','{"apodTitle":"APOD标题","courseId":"APOD课程ID"}',1,'APOD课程更新通知'),
('COURSE_COMPLETED','course','completed','恭喜完成课程',
 '恭喜您完成了课程《{courseTitle}》的全部学习！',
 '/course/{courseId}','{"courseTitle":"课程标题","courseId":"课程ID"}',1,'课程完成通知'),

-- 地理位置通知(2个) ✅ 已执行INSERT (6.0 2026-03-23)
('LOCATION_CHECKIN_SUCCESS','location','checkin_success','签到成功！🌟',
 '您已成功在「{spotName}」签到打卡，今日已有{todayCount}人在此观测，祝观测顺利！',
 '/location','{"spotName":"观测点名称","todayCount":"今日签到总人数","spotId":"观测点ID"}',1,'观测点签到成功通知（实时触发，6.3接入）'),
('LOCATION_WEATHER_SUITABLE','location','weather_suitable','今晚观测条件极佳！🔭',
 '根据您所在位置的天气和月相数据，今晚综合评分达{score}分，快去架好望远镜吧！',
 '/location','{"score":"今晚观测综合评分(0-100分)"}',0,'今晚观测条件极佳主动推送（默认禁用，管理员按需启用）'),

-- 论坛通知(9/9个) ✅ 7.7+7.8 全部入库 (2026-04-08, DB id 25-33)
--   📌 jumpUrl 全部指向 ForumList(?postId=)（FORUM_USER_FOLLOWED 例外，跳 /forum/user/{followerId}）
--   📌 SQL文件: src/main/resources/sql/7.8_forum_notification_templates.sql（7.8 新增 7 条）
('FORUM_POST_APPROVED','forum','post_approved','帖子审核通过 ✅',
 '您的帖子《{postTitle}》已通过审核，现在所有人都可以看到啦！',
 '/forum/list?postId={postId}','{"postTitle":"帖子标题","postId":"帖子ID"}',1,'帖子审核通过通知（7.7 后台审核触发，已入库 id=25）'),
('FORUM_POST_REJECTED','forum','post_rejected','帖子审核未通过 ❌',
 '很抱歉，您的帖子《{postTitle}》未通过审核。原因：{reason}。您可以编辑后重新提交。',
 '/forum/list?postId={postId}','{"postTitle":"帖子标题","reason":"拒绝原因","postId":"帖子ID"}',1,'帖子审核拒绝通知（7.7 后台审核触发，已入库 id=26）'),

-- 7.8 新增 7 条 ✅ 已入库 (2026-04-08, DB id 27-33)
('FORUM_POST_LIKED','forum','post_liked','收到了新点赞 ❤️',
 '{likerNickname} 赞了你的帖子《{postTitle}》',
 '/forum/list?postId={postId}','{"likerNickname":"点赞者昵称","postTitle":"帖子标题","postId":"帖子ID"}',1,'帖子被点赞通知（PostServiceImpl.likePost 触发，防自通知）'),
('FORUM_POST_COMMENTED','forum','post_commented','你的帖子收到了新评论 💬',
 '{commenterNickname} 评论了你的帖子《{postTitle}》：{commentSnippet}',
 '/forum/list?postId={postId}','{"commenterNickname":"评论者昵称","postTitle":"帖子标题","commentSnippet":"评论内容片段","postId":"帖子ID"}',1,'帖子被评论通知（CommentServiceImpl.addComment 顶级评论触发，防自通知）'),
('FORUM_COMMENT_REPLIED','forum','comment_replied','有人回复了你的评论 ↩️',
 '{replierNickname} 回复了你：{replySnippet}',
 '/forum/list?postId={postId}','{"replierNickname":"回复者昵称","replySnippet":"回复内容片段","postId":"帖子ID"}',1,'评论被回复通知（CommentServiceImpl.addComment 子回复触发，防自通知）'),
('FORUM_POST_COLLECTED','forum','post_collected','你的帖子被收藏了 ⭐',
 '{collectorNickname} 收藏了你的帖子《{postTitle}》',
 '/forum/list?postId={postId}','{"collectorNickname":"收藏者昵称","postTitle":"帖子标题","postId":"帖子ID"}',1,'帖子被收藏通知（PostServiceImpl.collectPost 触发，防自通知）'),
('FORUM_MENTIONED','forum','mentioned','有人在论坛 @ 了你 👀',
 '{mentionerNickname} 在帖子里提到了你',
 '/forum/list?postId={postId}','{"mentionerNickname":"@发起人昵称","postId":"帖子ID"}',1,'被@提及通知（扩展功能，前端解析@表达式后批量调用）'),
('FORUM_USER_FOLLOWED','forum','user_followed','你有了新粉丝 ✨',
 '{followerNickname} 关注了你，去看看 ta 的主页吧',
 '/forum/user/{followerId}','{"followerNickname":"关注者昵称","followerId":"关注者ID"}',1,'被关注通知（FollowServiceImpl.follow 触发，7.5 写代码 7.8 补模板）'),
('FORUM_POST_TRENDING','forum','post_trending','你的帖子上热门了 🔥',
 '恭喜！你的帖子《{postTitle}》热度持续上升，已被大家热烈关注',
 '/forum/list?postId={postId}','{"postTitle":"帖子标题","postId":"帖子ID"}',1,'帖子升为热门通知（ForumScheduler.calcHotScores 检测 is_hot 0→1 时触发，每帖一生只发一次）');

-- =============================================
-- 重要业务规则说明
-- =============================================
/*
1. 余额并发安全:
   - 所有余额变动必须通过 BalanceService.changeBalance() 统一入口
   - 内部 SELECT ... FOR UPDATE 行锁防并发
   - 严禁在其他Service中直接 UPDATE tb_user SET balance=...

2. 退款状态联动 (退款成功后):
   - tb_payment.status → 3 (已退款)
   - tb_order.status → 4 (已取消) [仅当订单status=1待发货时触发]
   - 通过 NotificationHelper 异步发送退款通知

3. 删除策略区分:
   - 管理员删除评价: status=0, deleted保持0 (用户我的评价页仍可见"已被删除")
   - 用户自己删除评价: @TableLogic deleted=1 (从我的评价页消失,可重新发布)

4. APOD/火星课完课排除:
   - is_apod_course=1 或 is_mars_course=1 的课程不触发完课通知
   - 这两类课程每天自动增章节,永远无法完课

5. 观测点评分同步:
   - 每次提交 tb_spot_rating 后,重新计算并更新 tb_observation_spot.rating 和 rating_count

6. 枚举值定义:
   订单状态: 0待支付 1待发货 2待收货 3已完成 4已取消
   支付状态: 0待支付 1成功 2失败 3已退款
   退款状态: 0待审核 1审核通过 2审核拒绝 3退款成功 4退款失败
   物流状态: 0未发货 1运输中 2派送中 3已签收
   余额类型: 1充值 2提现 3回收入账 4购物扣款
   安装预约: 0待确认 1已确认 2已取消
   二手回收: 0待审核 1已报价 2用户确认 3待取件 4已回收 5已拒绝 6用户取消
   Bortle等级: 1-9, 越小越暗越好(1=最佳暗天/9=城市天空)
*/

-- =============================================
-- 已执行的字段扩展记录
-- =============================================
/*
✅ ALTER TABLE tb_user ADD COLUMN balance decimal(10,2) NOT NULL DEFAULT '0.00' AFTER last_login_time;
✅ ALTER TABLE tb_user MODIFY COLUMN avatar MEDIUMTEXT;
✅ ALTER TABLE tb_user MODIFY longitude decimal(10,7) DEFAULT NULL COMMENT '用户常用位置经度(填写地址时更新,供推荐系统和地理位置模块使用)';
✅ ALTER TABLE tb_user MODIFY latitude decimal(10,7) DEFAULT NULL COMMENT '用户常用位置纬度(填写地址时更新,供推荐系统和地理位置模块使用)';
✅ ALTER TABLE tb_product ADD COLUMN tags VARCHAR(500) DEFAULT NULL;
✅ ALTER TABLE tb_product ADD INDEX idx_tags (tags(255));
✅ ALTER TABLE tb_order ADD COLUMN logistics_company VARCHAR(100) DEFAULT NULL;
✅ ALTER TABLE tb_order ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL;
✅ ALTER TABLE tb_order ADD COLUMN logistics_status TINYINT(4) DEFAULT 0;
✅ ALTER TABLE tb_order ADD COLUMN admin_remark VARCHAR(500) DEFAULT NULL;
✅ ALTER TABLE tb_review ADD COLUMN is_top tinyint(4) DEFAULT '0' AFTER reply_time;
✅ ALTER TABLE tb_review ADD COLUMN top_time datetime DEFAULT NULL AFTER is_top;
✅ ALTER TABLE tb_review ADD COLUMN report_count int(11) DEFAULT '0' AFTER top_time;
✅ ALTER TABLE tb_notification ADD COLUMN deleted tinyint(1) DEFAULT 0 AFTER extra_data;
✅ UPDATE tb_review SET deleted = 0 WHERE status = 0; -- 修正历史数据
*/
