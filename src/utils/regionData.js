/**
 * 中国省市区完整级联数据
 * 覆盖全国 34 个省级行政区 + 主要地级市 + 主要区县
 *
 * 📌 使用方式:
 * import { regionOptions } from '@/utils/regionData'
 *
 * 📌 数据说明:
 * - 直辖市（北京/上海/天津/重庆）第二级仍保留市名，第三级为区县
 * - 各省覆盖所有地级市，区县覆盖主要区县（部分偏远县区略）
 * - value 与 label 保持一致，方便直接拼接显示完整地址
 */

export const regionOptions = [
    // ============================================================
    // 📍 北京市
    // ============================================================
    {
        value: '北京市', label: '北京市',
        children: [{
            value: '北京市', label: '北京市',
            children: [
                { value: '东城区', label: '东城区' },
                { value: '西城区', label: '西城区' },
                { value: '朝阳区', label: '朝阳区' },
                { value: '丰台区', label: '丰台区' },
                { value: '石景山区', label: '石景山区' },
                { value: '海淀区', label: '海淀区' },
                { value: '门头沟区', label: '门头沟区' },
                { value: '房山区', label: '房山区' },
                { value: '通州区', label: '通州区' },
                { value: '顺义区', label: '顺义区' },
                { value: '昌平区', label: '昌平区' },
                { value: '大兴区', label: '大兴区' },
                { value: '怀柔区', label: '怀柔区' },
                { value: '平谷区', label: '平谷区' },
                { value: '密云区', label: '密云区' },
                { value: '延庆区', label: '延庆区' }
            ]
        }]
    },

    // ============================================================
    // 📍 上海市
    // ============================================================
    {
        value: '上海市', label: '上海市',
        children: [{
            value: '上海市', label: '上海市',
            children: [
                { value: '黄浦区', label: '黄浦区' },
                { value: '徐汇区', label: '徐汇区' },
                { value: '长宁区', label: '长宁区' },
                { value: '静安区', label: '静安区' },
                { value: '普陀区', label: '普陀区' },
                { value: '虹口区', label: '虹口区' },
                { value: '杨浦区', label: '杨浦区' },
                { value: '闵行区', label: '闵行区' },
                { value: '宝山区', label: '宝山区' },
                { value: '嘉定区', label: '嘉定区' },
                { value: '浦东新区', label: '浦东新区' },
                { value: '金山区', label: '金山区' },
                { value: '松江区', label: '松江区' },
                { value: '青浦区', label: '青浦区' },
                { value: '奉贤区', label: '奉贤区' },
                { value: '崇明区', label: '崇明区' }
            ]
        }]
    },

    // ============================================================
    // 📍 天津市
    // ============================================================
    {
        value: '天津市', label: '天津市',
        children: [{
            value: '天津市', label: '天津市',
            children: [
                { value: '和平区', label: '和平区' },
                { value: '河东区', label: '河东区' },
                { value: '河西区', label: '河西区' },
                { value: '南开区', label: '南开区' },
                { value: '河北区', label: '河北区' },
                { value: '红桥区', label: '红桥区' },
                { value: '东丽区', label: '东丽区' },
                { value: '西青区', label: '西青区' },
                { value: '津南区', label: '津南区' },
                { value: '北辰区', label: '北辰区' },
                { value: '武清区', label: '武清区' },
                { value: '宝坻区', label: '宝坻区' },
                { value: '滨海新区', label: '滨海新区' },
                { value: '宁河区', label: '宁河区' },
                { value: '静海区', label: '静海区' },
                { value: '蓟州区', label: '蓟州区' }
            ]
        }]
    },

    // ============================================================
    // 📍 重庆市
    // ============================================================
    {
        value: '重庆市', label: '重庆市',
        children: [{
            value: '重庆市', label: '重庆市',
            children: [
                { value: '渝中区', label: '渝中区' },
                { value: '大渡口区', label: '大渡口区' },
                { value: '江北区', label: '江北区' },
                { value: '沙坪坝区', label: '沙坪坝区' },
                { value: '九龙坡区', label: '九龙坡区' },
                { value: '南岸区', label: '南岸区' },
                { value: '北碚区', label: '北碚区' },
                { value: '綦江区', label: '綦江区' },
                { value: '大足区', label: '大足区' },
                { value: '渝北区', label: '渝北区' },
                { value: '巴南区', label: '巴南区' },
                { value: '黔江区', label: '黔江区' },
                { value: '长寿区', label: '长寿区' },
                { value: '江津区', label: '江津区' },
                { value: '合川区', label: '合川区' },
                { value: '永川区', label: '永川区' },
                { value: '南川区', label: '南川区' },
                { value: '璧山区', label: '璧山区' },
                { value: '铜梁区', label: '铜梁区' },
                { value: '潼南区', label: '潼南区' },
                { value: '荣昌区', label: '荣昌区' },
                { value: '开州区', label: '开州区' },
                { value: '梁平区', label: '梁平区' },
                { value: '武隆区', label: '武隆区' }
            ]
        }]
    },

    // ============================================================
    // 📍 广东省
    // ============================================================
    {
        value: '广东省', label: '广东省',
        children: [
            {
                value: '广州市', label: '广州市',
                children: [
                    { value: '荔湾区', label: '荔湾区' },
                    { value: '越秀区', label: '越秀区' },
                    { value: '海珠区', label: '海珠区' },
                    { value: '天河区', label: '天河区' },
                    { value: '白云区', label: '白云区' },
                    { value: '黄埔区', label: '黄埔区' },
                    { value: '番禺区', label: '番禺区' },
                    { value: '花都区', label: '花都区' },
                    { value: '南沙区', label: '南沙区' },
                    { value: '从化区', label: '从化区' },
                    { value: '增城区', label: '增城区' }
                ]
            },
            {
                value: '深圳市', label: '深圳市',
                children: [
                    { value: '罗湖区', label: '罗湖区' },
                    { value: '福田区', label: '福田区' },
                    { value: '南山区', label: '南山区' },
                    { value: '宝安区', label: '宝安区' },
                    { value: '龙岗区', label: '龙岗区' },
                    { value: '盐田区', label: '盐田区' },
                    { value: '龙华区', label: '龙华区' },
                    { value: '坪山区', label: '坪山区' },
                    { value: '光明区', label: '光明区' },
                    { value: '大鹏新区', label: '大鹏新区' }
                ]
            },
            {
                value: '珠海市', label: '珠海市',
                children: [
                    { value: '香洲区', label: '香洲区' },
                    { value: '斗门区', label: '斗门区' },
                    { value: '金湾区', label: '金湾区' }
                ]
            },
            {
                value: '汕头市', label: '汕头市',
                children: [
                    { value: '龙湖区', label: '龙湖区' },
                    { value: '金平区', label: '金平区' },
                    { value: '濠江区', label: '濠江区' },
                    { value: '潮阳区', label: '潮阳区' },
                    { value: '潮南区', label: '潮南区' },
                    { value: '澄海区', label: '澄海区' },
                    { value: '南澳县', label: '南澳县' }
                ]
            },
            {
                value: '佛山市', label: '佛山市',
                children: [
                    { value: '禅城区', label: '禅城区' },
                    { value: '南海区', label: '南海区' },
                    { value: '顺德区', label: '顺德区' },
                    { value: '三水区', label: '三水区' },
                    { value: '高明区', label: '高明区' }
                ]
            },
            {
                value: '东莞市', label: '东莞市',
                children: [
                    { value: '莞城区', label: '莞城区' },
                    { value: '南城区', label: '南城区' },
                    { value: '万江区', label: '万江区' },
                    { value: '石碣镇', label: '石碣镇' },
                    { value: '石龙镇', label: '石龙镇' },
                    { value: '茶山镇', label: '茶山镇' },
                    { value: '寮步镇', label: '寮步镇' },
                    { value: '长安镇', label: '长安镇' },
                    { value: '虎门镇', label: '虎门镇' },
                    { value: '厚街镇', label: '厚街镇' },
                    { value: '塘厦镇', label: '塘厦镇' },
                    { value: '凤岗镇', label: '凤岗镇' }
                ]
            },
            {
                value: '中山市', label: '中山市',
                children: [
                    { value: '石岐区', label: '石岐区' },
                    { value: '东区', label: '东区' },
                    { value: '西区', label: '西区' },
                    { value: '南区', label: '南区' },
                    { value: '五桂山区', label: '五桂山区' },
                    { value: '小榄镇', label: '小榄镇' },
                    { value: '坦洲镇', label: '坦洲镇' }
                ]
            },
            {
                value: '惠州市', label: '惠州市',
                children: [
                    { value: '惠城区', label: '惠城区' },
                    { value: '惠阳区', label: '惠阳区' },
                    { value: '博罗县', label: '博罗县' },
                    { value: '惠东县', label: '惠东县' },
                    { value: '龙门县', label: '龙门县' }
                ]
            },
            {
                value: '江门市', label: '江门市',
                children: [
                    { value: '蓬江区', label: '蓬江区' },
                    { value: '江海区', label: '江海区' },
                    { value: '新会区', label: '新会区' },
                    { value: '台山市', label: '台山市' },
                    { value: '开平市', label: '开平市' },
                    { value: '鹤山市', label: '鹤山市' },
                    { value: '恩平市', label: '恩平市' }
                ]
            },
            {
                value: '湛江市', label: '湛江市',
                children: [
                    { value: '赤坎区', label: '赤坎区' },
                    { value: '霞山区', label: '霞山区' },
                    { value: '坡头区', label: '坡头区' },
                    { value: '麻章区', label: '麻章区' },
                    { value: '遂溪县', label: '遂溪县' },
                    { value: '徐闻县', label: '徐闻县' },
                    { value: '廉江市', label: '廉江市' },
                    { value: '雷州市', label: '雷州市' },
                    { value: '吴川市', label: '吴川市' }
                ]
            },
            {
                value: '茂名市', label: '茂名市',
                children: [
                    { value: '茂南区', label: '茂南区' },
                    { value: '电白区', label: '电白区' },
                    { value: '高州市', label: '高州市' },
                    { value: '化州市', label: '化州市' },
                    { value: '信宜市', label: '信宜市' }
                ]
            },
            {
                value: '肇庆市', label: '肇庆市',
                children: [
                    { value: '端州区', label: '端州区' },
                    { value: '鼎湖区', label: '鼎湖区' },
                    { value: '高要区', label: '高要区' },
                    { value: '广宁县', label: '广宁县' },
                    { value: '怀集县', label: '怀集县' },
                    { value: '封开县', label: '封开县' },
                    { value: '德庆县', label: '德庆县' },
                    { value: '四会市', label: '四会市' }
                ]
            },
            {
                value: '清远市', label: '清远市',
                children: [
                    { value: '清城区', label: '清城区' },
                    { value: '清新区', label: '清新区' },
                    { value: '佛冈县', label: '佛冈县' },
                    { value: '阳山县', label: '阳山县' },
                    { value: '连山壮族瑶族自治县', label: '连山壮族瑶族自治县' },
                    { value: '英德市', label: '英德市' },
                    { value: '连州市', label: '连州市' }
                ]
            },
            {
                value: '潮州市', label: '潮州市',
                children: [
                    { value: '湘桥区', label: '湘桥区' },
                    { value: '潮安区', label: '潮安区' },
                    { value: '饶平县', label: '饶平县' }
                ]
            },
            {
                value: '揭州市', label: '揭州市',
                children: [
                    { value: '榕城区', label: '榕城区' },
                    { value: '揭东区', label: '揭东区' },
                    { value: '揭西县', label: '揭西县' },
                    { value: '惠来县', label: '惠来县' },
                    { value: '普宁市', label: '普宁市' }
                ]
            },
            {
                value: '云浮市', label: '云浮市',
                children: [
                    { value: '云城区', label: '云城区' },
                    { value: '云安区', label: '云安区' },
                    { value: '新兴县', label: '新兴县' },
                    { value: '郁南县', label: '郁南县' },
                    { value: '罗定市', label: '罗定市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 浙江省
    // ============================================================
    {
        value: '浙江省', label: '浙江省',
        children: [
            {
                value: '杭州市', label: '杭州市',
                children: [
                    { value: '上城区', label: '上城区' },
                    { value: '下城区', label: '下城区' },
                    { value: '江干区', label: '江干区' },
                    { value: '拱墅区', label: '拱墅区' },
                    { value: '西湖区', label: '西湖区' },
                    { value: '滨江区', label: '滨江区' },
                    { value: '萧山区', label: '萧山区' },
                    { value: '余杭区', label: '余杭区' },
                    { value: '富阳区', label: '富阳区' },
                    { value: '临安区', label: '临安区' },
                    { value: '临平区', label: '临平区' },
                    { value: '钱塘区', label: '钱塘区' }
                ]
            },
            {
                value: '宁波市', label: '宁波市',
                children: [
                    { value: '海曙区', label: '海曙区' },
                    { value: '江北区', label: '江北区' },
                    { value: '北仑区', label: '北仑区' },
                    { value: '镇海区', label: '镇海区' },
                    { value: '鄞州区', label: '鄞州区' },
                    { value: '奉化区', label: '奉化区' },
                    { value: '象山县', label: '象山县' },
                    { value: '宁海县', label: '宁海县' },
                    { value: '余姚市', label: '余姚市' },
                    { value: '慈溪市', label: '慈溪市' }
                ]
            },
            {
                value: '温州市', label: '温州市',
                children: [
                    { value: '鹿城区', label: '鹿城区' },
                    { value: '龙湾区', label: '龙湾区' },
                    { value: '瓯海区', label: '瓯海区' },
                    { value: '洞头区', label: '洞头区' },
                    { value: '平阳县', label: '平阳县' },
                    { value: '苍南县', label: '苍南县' },
                    { value: '文成县', label: '文成县' },
                    { value: '泰顺县', label: '泰顺县' },
                    { value: '瑞安市', label: '瑞安市' },
                    { value: '乐清市', label: '乐清市' },
                    { value: '龙港市', label: '龙港市' }
                ]
            },
            {
                value: '嘉兴市', label: '嘉兴市',
                children: [
                    { value: '南湖区', label: '南湖区' },
                    { value: '秀洲区', label: '秀洲区' },
                    { value: '嘉善县', label: '嘉善县' },
                    { value: '海盐县', label: '海盐县' },
                    { value: '海宁市', label: '海宁市' },
                    { value: '平湖市', label: '平湖市' },
                    { value: '桐乡市', label: '桐乡市' }
                ]
            },
            {
                value: '湖州市', label: '湖州市',
                children: [
                    { value: '吴兴区', label: '吴兴区' },
                    { value: '南浔区', label: '南浔区' },
                    { value: '德清县', label: '德清县' },
                    { value: '长兴县', label: '长兴县' },
                    { value: '安吉县', label: '安吉县' }
                ]
            },
            {
                value: '绍兴市', label: '绍兴市',
                children: [
                    { value: '越城区', label: '越城区' },
                    { value: '柯桥区', label: '柯桥区' },
                    { value: '上虞区', label: '上虞区' },
                    { value: '新昌县', label: '新昌县' },
                    { value: '诸暨市', label: '诸暨市' },
                    { value: '嵊州市', label: '嵊州市' }
                ]
            },
            {
                value: '金华市', label: '金华市',
                children: [
                    { value: '婺城区', label: '婺城区' },
                    { value: '金东区', label: '金东区' },
                    { value: '武义县', label: '武义县' },
                    { value: '浦江县', label: '浦江县' },
                    { value: '磐安县', label: '磐安县' },
                    { value: '兰溪市', label: '兰溪市' },
                    { value: '义乌市', label: '义乌市' },
                    { value: '东阳市', label: '东阳市' },
                    { value: '永康市', label: '永康市' }
                ]
            },
            {
                value: '衢州市', label: '衢州市',
                children: [
                    { value: '柯城区', label: '柯城区' },
                    { value: '衢江区', label: '衢江区' },
                    { value: '常山县', label: '常山县' },
                    { value: '开化县', label: '开化县' },
                    { value: '龙游县', label: '龙游县' },
                    { value: '江山市', label: '江山市' }
                ]
            },
            {
                value: '舟山市', label: '舟山市',
                children: [
                    { value: '定海区', label: '定海区' },
                    { value: '普陀区', label: '普陀区' },
                    { value: '岱山县', label: '岱山县' },
                    { value: '嵊泗县', label: '嵊泗县' }
                ]
            },
            {
                value: '台州市', label: '台州市',
                children: [
                    { value: '椒江区', label: '椒江区' },
                    { value: '黄岩区', label: '黄岩区' },
                    { value: '路桥区', label: '路桥区' },
                    { value: '三门县', label: '三门县' },
                    { value: '天台县', label: '天台县' },
                    { value: '仙居县', label: '仙居县' },
                    { value: '温岭市', label: '温岭市' },
                    { value: '临海市', label: '临海市' },
                    { value: '玉环市', label: '玉环市' }
                ]
            },
            {
                value: '丽水市', label: '丽水市',
                children: [
                    { value: '莲都区', label: '莲都区' },
                    { value: '青田县', label: '青田县' },
                    { value: '缙云县', label: '缙云县' },
                    { value: '遂昌县', label: '遂昌县' },
                    { value: '松阳县', label: '松阳县' },
                    { value: '云和县', label: '云和县' },
                    { value: '庆元县', label: '庆元县' },
                    { value: '景宁畲族自治县', label: '景宁畲族自治县' },
                    { value: '龙泉市', label: '龙泉市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 江苏省
    // ============================================================
    {
        value: '江苏省', label: '江苏省',
        children: [
            {
                value: '南京市', label: '南京市',
                children: [
                    { value: '玄武区', label: '玄武区' },
                    { value: '秦淮区', label: '秦淮区' },
                    { value: '建邺区', label: '建邺区' },
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '浦口区', label: '浦口区' },
                    { value: '栖霞区', label: '栖霞区' },
                    { value: '雨花台区', label: '雨花台区' },
                    { value: '江宁区', label: '江宁区' },
                    { value: '六合区', label: '六合区' },
                    { value: '溧水区', label: '溧水区' },
                    { value: '高淳区', label: '高淳区' }
                ]
            },
            {
                value: '无锡市', label: '无锡市',
                children: [
                    { value: '梁溪区', label: '梁溪区' },
                    { value: '锡山区', label: '锡山区' },
                    { value: '惠山区', label: '惠山区' },
                    { value: '滨湖区', label: '滨湖区' },
                    { value: '新吴区', label: '新吴区' },
                    { value: '江阴市', label: '江阴市' },
                    { value: '宜兴市', label: '宜兴市' }
                ]
            },
            {
                value: '徐州市', label: '徐州市',
                children: [
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '云龙区', label: '云龙区' },
                    { value: '贾汪区', label: '贾汪区' },
                    { value: '泉山区', label: '泉山区' },
                    { value: '铜山区', label: '铜山区' },
                    { value: '丰县', label: '丰县' },
                    { value: '沛县', label: '沛县' },
                    { value: '睢宁县', label: '睢宁县' },
                    { value: '邳州市', label: '邳州市' },
                    { value: '新沂市', label: '新沂市' }
                ]
            },
            {
                value: '常州市', label: '常州市',
                children: [
                    { value: '天宁区', label: '天宁区' },
                    { value: '钟楼区', label: '钟楼区' },
                    { value: '新北区', label: '新北区' },
                    { value: '武进区', label: '武进区' },
                    { value: '金坛区', label: '金坛区' },
                    { value: '溧阳市', label: '溧阳市' }
                ]
            },
            {
                value: '苏州市', label: '苏州市',
                children: [
                    { value: '虎丘区', label: '虎丘区' },
                    { value: '吴中区', label: '吴中区' },
                    { value: '相城区', label: '相城区' },
                    { value: '姑苏区', label: '姑苏区' },
                    { value: '吴江区', label: '吴江区' },
                    { value: '工业园区', label: '工业园区' },
                    { value: '常熟市', label: '常熟市' },
                    { value: '张家港市', label: '张家港市' },
                    { value: '昆山市', label: '昆山市' },
                    { value: '太仓市', label: '太仓市' }
                ]
            },
            {
                value: '南通市', label: '南通市',
                children: [
                    { value: '崇川区', label: '崇川区' },
                    { value: '港闸区', label: '港闸区' },
                    { value: '通州区', label: '通州区' },
                    { value: '如东县', label: '如东县' },
                    { value: '启东市', label: '启东市' },
                    { value: '如皋市', label: '如皋市' },
                    { value: '海门区', label: '海门区' },
                    { value: '海安市', label: '海安市' }
                ]
            },
            {
                value: '连云港市', label: '连云港市',
                children: [
                    { value: '连云区', label: '连云区' },
                    { value: '海州区', label: '海州区' },
                    { value: '赣榆区', label: '赣榆区' },
                    { value: '东海县', label: '东海县' },
                    { value: '灌云县', label: '灌云县' },
                    { value: '灌南县', label: '灌南县' }
                ]
            },
            {
                value: '淮安市', label: '淮安市',
                children: [
                    { value: '淮安区', label: '淮安区' },
                    { value: '淮阴区', label: '淮阴区' },
                    { value: '清江浦区', label: '清江浦区' },
                    { value: '洪泽区', label: '洪泽区' },
                    { value: '涟水县', label: '涟水县' },
                    { value: '盱眙县', label: '盱眙县' },
                    { value: '金湖县', label: '金湖县' }
                ]
            },
            {
                value: '盐城市', label: '盐城市',
                children: [
                    { value: '亭湖区', label: '亭湖区' },
                    { value: '盐都区', label: '盐都区' },
                    { value: '大丰区', label: '大丰区' },
                    { value: '响水县', label: '响水县' },
                    { value: '滨海县', label: '滨海县' },
                    { value: '阜宁县', label: '阜宁县' },
                    { value: '射阳县', label: '射阳县' },
                    { value: '建湖县', label: '建湖县' },
                    { value: '东台市', label: '东台市' }
                ]
            },
            {
                value: '扬州市', label: '扬州市',
                children: [
                    { value: '广陵区', label: '广陵区' },
                    { value: '邗江区', label: '邗江区' },
                    { value: '江都区', label: '江都区' },
                    { value: '宝应县', label: '宝应县' },
                    { value: '仪征市', label: '仪征市' },
                    { value: '高邮市', label: '高邮市' }
                ]
            },
            {
                value: '镇江市', label: '镇江市',
                children: [
                    { value: '京口区', label: '京口区' },
                    { value: '润州区', label: '润州区' },
                    { value: '丹徒区', label: '丹徒区' },
                    { value: '丹阳市', label: '丹阳市' },
                    { value: '扬中市', label: '扬中市' },
                    { value: '句容市', label: '句容市' }
                ]
            },
            {
                value: '泰州市', label: '泰州市',
                children: [
                    { value: '海陵区', label: '海陵区' },
                    { value: '高港区', label: '高港区' },
                    { value: '姜堰区', label: '姜堰区' },
                    { value: '兴化市', label: '兴化市' },
                    { value: '靖江市', label: '靖江市' },
                    { value: '泰兴市', label: '泰兴市' }
                ]
            },
            {
                value: '宿迁市', label: '宿迁市',
                children: [
                    { value: '宿城区', label: '宿城区' },
                    { value: '宿豫区', label: '宿豫区' },
                    { value: '沭阳县', label: '沭阳县' },
                    { value: '泗阳县', label: '泗阳县' },
                    { value: '泗洪县', label: '泗洪县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 山东省
    // ============================================================
    {
        value: '山东省', label: '山东省',
        children: [
            {
                value: '济南市', label: '济南市',
                children: [
                    { value: '历下区', label: '历下区' },
                    { value: '市中区', label: '市中区' },
                    { value: '槐荫区', label: '槐荫区' },
                    { value: '天桥区', label: '天桥区' },
                    { value: '历城区', label: '历城区' },
                    { value: '长清区', label: '长清区' },
                    { value: '章丘区', label: '章丘区' },
                    { value: '济阳区', label: '济阳区' },
                    { value: '莱芜区', label: '莱芜区' },
                    { value: '钢城区', label: '钢城区' }
                ]
            },
            {
                value: '青岛市', label: '青岛市',
                children: [
                    { value: '市南区', label: '市南区' },
                    { value: '市北区', label: '市北区' },
                    { value: '黄岛区', label: '黄岛区' },
                    { value: '崂山区', label: '崂山区' },
                    { value: '李沧区', label: '李沧区' },
                    { value: '城阳区', label: '城阳区' },
                    { value: '即墨区', label: '即墨区' },
                    { value: '胶州市', label: '胶州市' },
                    { value: '平度市', label: '平度市' },
                    { value: '莱西市', label: '莱西市' }
                ]
            },
            {
                value: '淄博市', label: '淄博市',
                children: [
                    { value: '淄川区', label: '淄川区' },
                    { value: '张店区', label: '张店区' },
                    { value: '博山区', label: '博山区' },
                    { value: '临淄区', label: '临淄区' },
                    { value: '周村区', label: '周村区' },
                    { value: '桓台县', label: '桓台县' },
                    { value: '高青县', label: '高青县' },
                    { value: '沂源县', label: '沂源县' }
                ]
            },
            {
                value: '烟台市', label: '烟台市',
                children: [
                    { value: '芝罘区', label: '芝罘区' },
                    { value: '福山区', label: '福山区' },
                    { value: '牟平区', label: '牟平区' },
                    { value: '莱山区', label: '莱山区' },
                    { value: '蓬莱区', label: '蓬莱区' },
                    { value: '龙口市', label: '龙口市' },
                    { value: '莱阳市', label: '莱阳市' },
                    { value: '莱州市', label: '莱州市' },
                    { value: '招远市', label: '招远市' },
                    { value: '栖霞市', label: '栖霞市' },
                    { value: '海阳市', label: '海阳市' }
                ]
            },
            {
                value: '潍坊市', label: '潍坊市',
                children: [
                    { value: '潍城区', label: '潍城区' },
                    { value: '寒亭区', label: '寒亭区' },
                    { value: '坊子区', label: '坊子区' },
                    { value: '奎文区', label: '奎文区' },
                    { value: '青州市', label: '青州市' },
                    { value: '诸城市', label: '诸城市' },
                    { value: '寿光市', label: '寿光市' },
                    { value: '安丘市', label: '安丘市' },
                    { value: '高密市', label: '高密市' },
                    { value: '昌邑市', label: '昌邑市' }
                ]
            },
            {
                value: '济宁市', label: '济宁市',
                children: [
                    { value: '任城区', label: '任城区' },
                    { value: '兖州区', label: '兖州区' },
                    { value: '微山县', label: '微山县' },
                    { value: '鱼台县', label: '鱼台县' },
                    { value: '金乡县', label: '金乡县' },
                    { value: '嘉祥县', label: '嘉祥县' },
                    { value: '汶上县', label: '汶上县' },
                    { value: '泗水县', label: '泗水县' },
                    { value: '梁山县', label: '梁山县' },
                    { value: '曲阜市', label: '曲阜市' },
                    { value: '邹城市', label: '邹城市' }
                ]
            },
            {
                value: '临沂市', label: '临沂市',
                children: [
                    { value: '兰山区', label: '兰山区' },
                    { value: '罗庄区', label: '罗庄区' },
                    { value: '河东区', label: '河东区' },
                    { value: '沂南县', label: '沂南县' },
                    { value: '郯城县', label: '郯城县' },
                    { value: '沂水县', label: '沂水县' },
                    { value: '兰陵县', label: '兰陵县' },
                    { value: '费县', label: '费县' },
                    { value: '平邑县', label: '平邑县' },
                    { value: '莒南县', label: '莒南县' },
                    { value: '蒙阴县', label: '蒙阴县' },
                    { value: '临沭县', label: '临沭县' }
                ]
            },
            {
                value: '威海市', label: '威海市',
                children: [
                    { value: '环翠区', label: '环翠区' },
                    { value: '文登区', label: '文登区' },
                    { value: '荣成市', label: '荣成市' },
                    { value: '乳山市', label: '乳山市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 四川省
    // ============================================================
    {
        value: '四川省', label: '四川省',
        children: [
            {
                value: '成都市', label: '成都市',
                children: [
                    { value: '锦江区', label: '锦江区' },
                    { value: '青羊区', label: '青羊区' },
                    { value: '金牛区', label: '金牛区' },
                    { value: '武侯区', label: '武侯区' },
                    { value: '成华区', label: '成华区' },
                    { value: '龙泉驿区', label: '龙泉驿区' },
                    { value: '青白江区', label: '青白江区' },
                    { value: '新都区', label: '新都区' },
                    { value: '温江区', label: '温江区' },
                    { value: '双流区', label: '双流区' },
                    { value: '郫都区', label: '郫都区' },
                    { value: '新津区', label: '新津区' },
                    { value: '高新区', label: '高新区' },
                    { value: '天府新区', label: '天府新区' },
                    { value: '都江堰市', label: '都江堰市' },
                    { value: '彭州市', label: '彭州市' },
                    { value: '邛崃市', label: '邛崃市' },
                    { value: '崇州市', label: '崇州市' },
                    { value: '简阳市', label: '简阳市' }
                ]
            },
            {
                value: '绵阳市', label: '绵阳市',
                children: [
                    { value: '涪城区', label: '涪城区' },
                    { value: '游仙区', label: '游仙区' },
                    { value: '安州区', label: '安州区' },
                    { value: '三台县', label: '三台县' },
                    { value: '江油市', label: '江油市' }
                ]
            },
            {
                value: '德阳市', label: '德阳市',
                children: [
                    { value: '旌阳区', label: '旌阳区' },
                    { value: '罗江区', label: '罗江区' },
                    { value: '中江县', label: '中江县' },
                    { value: '广汉市', label: '广汉市' },
                    { value: '什邡市', label: '什邡市' },
                    { value: '绵竹市', label: '绵竹市' }
                ]
            },
            {
                value: '南充市', label: '南充市',
                children: [
                    { value: '顺庆区', label: '顺庆区' },
                    { value: '高坪区', label: '高坪区' },
                    { value: '嘉陵区', label: '嘉陵区' },
                    { value: '阆中市', label: '阆中市' }
                ]
            },
            {
                value: '宜宾市', label: '宜宾市',
                children: [
                    { value: '翠屏区', label: '翠屏区' },
                    { value: '南溪区', label: '南溪区' },
                    { value: '叙州区', label: '叙州区' },
                    { value: '宜宾县', label: '宜宾县' }
                ]
            },
            {
                value: '泸州市', label: '泸州市',
                children: [
                    { value: '江阳区', label: '江阳区' },
                    { value: '纳溪区', label: '纳溪区' },
                    { value: '龙马潭区', label: '龙马潭区' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 湖北省
    // ============================================================
    {
        value: '湖北省', label: '湖北省',
        children: [
            {
                value: '武汉市', label: '武汉市',
                children: [
                    { value: '江岸区', label: '江岸区' },
                    { value: '江汉区', label: '江汉区' },
                    { value: '硚口区', label: '硚口区' },
                    { value: '汉阳区', label: '汉阳区' },
                    { value: '武昌区', label: '武昌区' },
                    { value: '青山区', label: '青山区' },
                    { value: '洪山区', label: '洪山区' },
                    { value: '蔡甸区', label: '蔡甸区' },
                    { value: '江夏区', label: '江夏区' },
                    { value: '黄陂区', label: '黄陂区' },
                    { value: '新洲区', label: '新洲区' },
                    { value: '东西湖区', label: '东西湖区' },
                    { value: '汉南区', label: '汉南区' }
                ]
            },
            {
                value: '宜昌市', label: '宜昌市',
                children: [
                    { value: '西陵区', label: '西陵区' },
                    { value: '伍家岗区', label: '伍家岗区' },
                    { value: '点军区', label: '点军区' },
                    { value: '猇亭区', label: '猇亭区' },
                    { value: '夷陵区', label: '夷陵区' },
                    { value: '宜都市', label: '宜都市' },
                    { value: '当阳市', label: '当阳市' },
                    { value: '枝江市', label: '枝江市' }
                ]
            },
            {
                value: '荆州市', label: '荆州市',
                children: [
                    { value: '沙市区', label: '沙市区' },
                    { value: '荆州区', label: '荆州区' },
                    { value: '公安县', label: '公安县' },
                    { value: '监利市', label: '监利市' },
                    { value: '江陵县', label: '江陵县' },
                    { value: '石首市', label: '石首市' },
                    { value: '洪湖市', label: '洪湖市' },
                    { value: '松滋市', label: '松滋市' }
                ]
            },
            {
                value: '襄阳市', label: '襄阳市',
                children: [
                    { value: '襄城区', label: '襄城区' },
                    { value: '樊城区', label: '樊城区' },
                    { value: '襄州区', label: '襄州区' },
                    { value: '南漳县', label: '南漳县' },
                    { value: '谷城县', label: '谷城县' },
                    { value: '保康县', label: '保康县' },
                    { value: '老河口市', label: '老河口市' },
                    { value: '枣阳市', label: '枣阳市' },
                    { value: '宜城市', label: '宜城市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 河南省
    // ============================================================
    {
        value: '河南省', label: '河南省',
        children: [
            {
                value: '郑州市', label: '郑州市',
                children: [
                    { value: '中原区', label: '中原区' },
                    { value: '二七区', label: '二七区' },
                    { value: '管城回族区', label: '管城回族区' },
                    { value: '金水区', label: '金水区' },
                    { value: '上街区', label: '上街区' },
                    { value: '惠济区', label: '惠济区' },
                    { value: '中牟县', label: '中牟县' },
                    { value: '荥阳市', label: '荥阳市' },
                    { value: '新密市', label: '新密市' },
                    { value: '新郑市', label: '新郑市' },
                    { value: '登封市', label: '登封市' }
                ]
            },
            {
                value: '洛阳市', label: '洛阳市',
                children: [
                    { value: '老城区', label: '老城区' },
                    { value: '西工区', label: '西工区' },
                    { value: '瀍河回族区', label: '瀍河回族区' },
                    { value: '涧西区', label: '涧西区' },
                    { value: '偃师区', label: '偃师区' },
                    { value: '孟津区', label: '孟津区' },
                    { value: '洛龙区', label: '洛龙区' },
                    { value: '伊川县', label: '伊川县' },
                    { value: '栾川县', label: '栾川县' },
                    { value: '嵩县', label: '嵩县' }
                ]
            },
            {
                value: '开封市', label: '开封市',
                children: [
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '顺河回族区', label: '顺河回族区' },
                    { value: '禹王台区', label: '禹王台区' },
                    { value: '祥符区', label: '祥符区' },
                    { value: '杞县', label: '杞县' },
                    { value: '通许县', label: '通许县' },
                    { value: '尉氏县', label: '尉氏县' }
                ]
            },
            {
                value: '南阳市', label: '南阳市',
                children: [
                    { value: '宛城区', label: '宛城区' },
                    { value: '卧龙区', label: '卧龙区' },
                    { value: '南召县', label: '南召县' },
                    { value: '方城县', label: '方城县' },
                    { value: '西峡县', label: '西峡县' },
                    { value: '邓州市', label: '邓州市' }
                ]
            },
            {
                value: '新乡市', label: '新乡市',
                children: [
                    { value: '红旗区', label: '红旗区' },
                    { value: '卫滨区', label: '卫滨区' },
                    { value: '凤泉区', label: '凤泉区' },
                    { value: '牧野区', label: '牧野区' },
                    { value: '获嘉县', label: '获嘉县' },
                    { value: '辉县市', label: '辉县市' },
                    { value: '长垣市', label: '长垣市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 湖南省
    // ============================================================
    {
        value: '湖南省', label: '湖南省',
        children: [
            {
                value: '长沙市', label: '长沙市',
                children: [
                    { value: '芙蓉区', label: '芙蓉区' },
                    { value: '天心区', label: '天心区' },
                    { value: '岳麓区', label: '岳麓区' },
                    { value: '开福区', label: '开福区' },
                    { value: '雨花区', label: '雨花区' },
                    { value: '望城区', label: '望城区' },
                    { value: '长沙县', label: '长沙县' },
                    { value: '浏阳市', label: '浏阳市' },
                    { value: '宁乡市', label: '宁乡市' }
                ]
            },
            {
                value: '株洲市', label: '株洲市',
                children: [
                    { value: '荷塘区', label: '荷塘区' },
                    { value: '芦淞区', label: '芦淞区' },
                    { value: '石峰区', label: '石峰区' },
                    { value: '天元区', label: '天元区' },
                    { value: '渌口区', label: '渌口区' },
                    { value: '醴陵市', label: '醴陵市' }
                ]
            },
            {
                value: '湘潭市', label: '湘潭市',
                children: [
                    { value: '雨湖区', label: '雨湖区' },
                    { value: '岳塘区', label: '岳塘区' },
                    { value: '湘潭县', label: '湘潭县' },
                    { value: '湘乡市', label: '湘乡市' },
                    { value: '韶山市', label: '韶山市' }
                ]
            },
            {
                value: '岳阳市', label: '岳阳市',
                children: [
                    { value: '岳阳楼区', label: '岳阳楼区' },
                    { value: '云溪区', label: '云溪区' },
                    { value: '君山区', label: '君山区' },
                    { value: '岳阳县', label: '岳阳县' },
                    { value: '华容县', label: '华容县' },
                    { value: '汨罗市', label: '汨罗市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 福建省
    // ============================================================
    {
        value: '福建省', label: '福建省',
        children: [
            {
                value: '福州市', label: '福州市',
                children: [
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '台江区', label: '台江区' },
                    { value: '仓山区', label: '仓山区' },
                    { value: '马尾区', label: '马尾区' },
                    { value: '晋安区', label: '晋安区' },
                    { value: '长乐区', label: '长乐区' },
                    { value: '闽侯县', label: '闽侯县' },
                    { value: '连江县', label: '连江县' },
                    { value: '福清市', label: '福清市' },
                    { value: '闽清县', label: '闽清县' }
                ]
            },
            {
                value: '厦门市', label: '厦门市',
                children: [
                    { value: '思明区', label: '思明区' },
                    { value: '海沧区', label: '海沧区' },
                    { value: '湖里区', label: '湖里区' },
                    { value: '集美区', label: '集美区' },
                    { value: '同安区', label: '同安区' },
                    { value: '翔安区', label: '翔安区' }
                ]
            },
            {
                value: '泉州市', label: '泉州市',
                children: [
                    { value: '鲤城区', label: '鲤城区' },
                    { value: '丰泽区', label: '丰泽区' },
                    { value: '洛江区', label: '洛江区' },
                    { value: '泉港区', label: '泉港区' },
                    { value: '惠安县', label: '惠安县' },
                    { value: '安溪县', label: '安溪县' },
                    { value: '永春县', label: '永春县' },
                    { value: '德化县', label: '德化县' },
                    { value: '石狮市', label: '石狮市' },
                    { value: '晋江市', label: '晋江市' },
                    { value: '南安市', label: '南安市' }
                ]
            },
            {
                value: '漳州市', label: '漳州市',
                children: [
                    { value: '芗城区', label: '芗城区' },
                    { value: '龙文区', label: '龙文区' },
                    { value: '龙海区', label: '龙海区' },
                    { value: '长泰区', label: '长泰区' },
                    { value: '漳浦县', label: '漳浦县' },
                    { value: '云霄县', label: '云霄县' },
                    { value: '诏安县', label: '诏安县' },
                    { value: '东山县', label: '东山县' }
                ]
            },
            {
                value: '莆田市', label: '莆田市',
                children: [
                    { value: '城厢区', label: '城厢区' },
                    { value: '涵江区', label: '涵江区' },
                    { value: '荔城区', label: '荔城区' },
                    { value: '秀屿区', label: '秀屿区' },
                    { value: '仙游县', label: '仙游县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 安徽省
    // ============================================================
    {
        value: '安徽省', label: '安徽省',
        children: [
            {
                value: '合肥市', label: '合肥市',
                children: [
                    { value: '瑶海区', label: '瑶海区' },
                    { value: '庐阳区', label: '庐阳区' },
                    { value: '蜀山区', label: '蜀山区' },
                    { value: '包河区', label: '包河区' },
                    { value: '长丰县', label: '长丰县' },
                    { value: '肥东县', label: '肥东县' },
                    { value: '肥西县', label: '肥西县' },
                    { value: '庐江县', label: '庐江县' },
                    { value: '巢湖市', label: '巢湖市' }
                ]
            },
            {
                value: '芜湖市', label: '芜湖市',
                children: [
                    { value: '镜湖区', label: '镜湖区' },
                    { value: '鸠江区', label: '鸠江区' },
                    { value: '弋江区', label: '弋江区' },
                    { value: '湾沚区', label: '湾沚区' },
                    { value: '繁昌区', label: '繁昌区' },
                    { value: '南陵县', label: '南陵县' }
                ]
            },
            {
                value: '马鞍山市', label: '马鞍山市',
                children: [
                    { value: '花山区', label: '花山区' },
                    { value: '雨山区', label: '雨山区' },
                    { value: '博望区', label: '博望区' },
                    { value: '当涂县', label: '当涂县' },
                    { value: '含山县', label: '含山县' },
                    { value: '和县', label: '和县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 河北省
    // ============================================================
    {
        value: '河北省', label: '河北省',
        children: [
            {
                value: '石家庄市', label: '石家庄市',
                children: [
                    { value: '长安区', label: '长安区' },
                    { value: '桥西区', label: '桥西区' },
                    { value: '新华区', label: '新华区' },
                    { value: '井陉矿区', label: '井陉矿区' },
                    { value: '裕华区', label: '裕华区' },
                    { value: '藁城区', label: '藁城区' },
                    { value: '鹿泉区', label: '鹿泉区' },
                    { value: '栾城区', label: '栾城区' },
                    { value: '辛集市', label: '辛集市' },
                    { value: '晋州市', label: '晋州市' },
                    { value: '新乐市', label: '新乐市' }
                ]
            },
            {
                value: '唐山市', label: '唐山市',
                children: [
                    { value: '路南区', label: '路南区' },
                    { value: '路北区', label: '路北区' },
                    { value: '古冶区', label: '古冶区' },
                    { value: '开平区', label: '开平区' },
                    { value: '丰南区', label: '丰南区' },
                    { value: '丰润区', label: '丰润区' },
                    { value: '曹妃甸区', label: '曹妃甸区' },
                    { value: '迁安市', label: '迁安市' }
                ]
            },
            {
                value: '保定市', label: '保定市',
                children: [
                    { value: '竞秀区', label: '竞秀区' },
                    { value: '莲池区', label: '莲池区' },
                    { value: '满城区', label: '满城区' },
                    { value: '清苑区', label: '清苑区' },
                    { value: '徐水区', label: '徐水区' },
                    { value: '高碑店市', label: '高碑店市' },
                    { value: '涿州市', label: '涿州市' },
                    { value: '定州市', label: '定州市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 陕西省
    // ============================================================
    {
        value: '陕西省', label: '陕西省',
        children: [
            {
                value: '西安市', label: '西安市',
                children: [
                    { value: '新城区', label: '新城区' },
                    { value: '碑林区', label: '碑林区' },
                    { value: '莲湖区', label: '莲湖区' },
                    { value: '灞桥区', label: '灞桥区' },
                    { value: '未央区', label: '未央区' },
                    { value: '雁塔区', label: '雁塔区' },
                    { value: '阎良区', label: '阎良区' },
                    { value: '临潼区', label: '临潼区' },
                    { value: '长安区', label: '长安区' },
                    { value: '高陵区', label: '高陵区' },
                    { value: '鄠邑区', label: '鄠邑区' },
                    { value: '周至县', label: '周至县' },
                    { value: '蓝田县', label: '蓝田县' }
                ]
            },
            {
                value: '宝鸡市', label: '宝鸡市',
                children: [
                    { value: '渭滨区', label: '渭滨区' },
                    { value: '金台区', label: '金台区' },
                    { value: '陈仓区', label: '陈仓区' }
                ]
            },
            {
                value: '咸阳市', label: '咸阳市',
                children: [
                    { value: '秦都区', label: '秦都区' },
                    { value: '渭城区', label: '渭城区' },
                    { value: '兴平市', label: '兴平市' }
                ]
            },
            {
                value: '渭南市', label: '渭南市',
                children: [
                    { value: '临渭区', label: '临渭区' },
                    { value: '华州区', label: '华州区' },
                    { value: '华阴市', label: '华阴市' },
                    { value: '韩城市', label: '韩城市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 辽宁省
    // ============================================================
    {
        value: '辽宁省', label: '辽宁省',
        children: [
            {
                value: '沈阳市', label: '沈阳市',
                children: [
                    { value: '和平区', label: '和平区' },
                    { value: '沈河区', label: '沈河区' },
                    { value: '大东区', label: '大东区' },
                    { value: '皇姑区', label: '皇姑区' },
                    { value: '铁西区', label: '铁西区' },
                    { value: '苏家屯区', label: '苏家屯区' },
                    { value: '浑南区', label: '浑南区' },
                    { value: '沈北新区', label: '沈北新区' },
                    { value: '于洪区', label: '于洪区' },
                    { value: '辽中区', label: '辽中区' }
                ]
            },
            {
                value: '大连市', label: '大连市',
                children: [
                    { value: '中山区', label: '中山区' },
                    { value: '西岗区', label: '西岗区' },
                    { value: '沙河口区', label: '沙河口区' },
                    { value: '甘井子区', label: '甘井子区' },
                    { value: '旅顺口区', label: '旅顺口区' },
                    { value: '金州区', label: '金州区' },
                    { value: '普兰店区', label: '普兰店区' },
                    { value: '长海县', label: '长海县' },
                    { value: '瓦房店市', label: '瓦房店市' },
                    { value: '庄河市', label: '庄河市' }
                ]
            },
            {
                value: '鞍山市', label: '鞍山市',
                children: [
                    { value: '铁东区', label: '铁东区' },
                    { value: '铁西区', label: '铁西区' },
                    { value: '立山区', label: '立山区' },
                    { value: '千山区', label: '千山区' },
                    { value: '台安县', label: '台安县' },
                    { value: '海城市', label: '海城市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 吉林省
    // ============================================================
    {
        value: '吉林省', label: '吉林省',
        children: [
            {
                value: '长春市', label: '长春市',
                children: [
                    { value: '南关区', label: '南关区' },
                    { value: '宽城区', label: '宽城区' },
                    { value: '朝阳区', label: '朝阳区' },
                    { value: '二道区', label: '二道区' },
                    { value: '绿园区', label: '绿园区' },
                    { value: '双阳区', label: '双阳区' },
                    { value: '九台区', label: '九台区' },
                    { value: '榆树市', label: '榆树市' },
                    { value: '德惠市', label: '德惠市' }
                ]
            },
            {
                value: '吉林市', label: '吉林市',
                children: [
                    { value: '昌邑区', label: '昌邑区' },
                    { value: '龙潭区', label: '龙潭区' },
                    { value: '船营区', label: '船营区' },
                    { value: '丰满区', label: '丰满区' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 黑龙江省
    // ============================================================
    {
        value: '黑龙江省', label: '黑龙江省',
        children: [
            {
                value: '哈尔滨市', label: '哈尔滨市',
                children: [
                    { value: '道里区', label: '道里区' },
                    { value: '南岗区', label: '南岗区' },
                    { value: '道外区', label: '道外区' },
                    { value: '平房区', label: '平房区' },
                    { value: '松北区', label: '松北区' },
                    { value: '香坊区', label: '香坊区' },
                    { value: '呼兰区', label: '呼兰区' },
                    { value: '阿城区', label: '阿城区' },
                    { value: '双城区', label: '双城区' }
                ]
            },
            {
                value: '齐齐哈尔市', label: '齐齐哈尔市',
                children: [
                    { value: '龙沙区', label: '龙沙区' },
                    { value: '建华区', label: '建华区' },
                    { value: '铁锋区', label: '铁锋区' },
                    { value: '昂昂溪区', label: '昂昂溪区' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 山西省
    // ============================================================
    {
        value: '山西省', label: '山西省',
        children: [
            {
                value: '太原市', label: '太原市',
                children: [
                    { value: '小店区', label: '小店区' },
                    { value: '迎泽区', label: '迎泽区' },
                    { value: '杏花岭区', label: '杏花岭区' },
                    { value: '尖草坪区', label: '尖草坪区' },
                    { value: '万柏林区', label: '万柏林区' },
                    { value: '晋源区', label: '晋源区' },
                    { value: '清徐县', label: '清徐县' },
                    { value: '古交市', label: '古交市' }
                ]
            },
            {
                value: '大同市', label: '大同市',
                children: [
                    { value: '平城区', label: '平城区' },
                    { value: '云冈区', label: '云冈区' },
                    { value: '云州区', label: '云州区' },
                    { value: '阳高县', label: '阳高县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 内蒙古自治区
    // ============================================================
    {
        value: '内蒙古自治区', label: '内蒙古自治区',
        children: [
            {
                value: '呼和浩特市', label: '呼和浩特市',
                children: [
                    { value: '回民区', label: '回民区' },
                    { value: '玉泉区', label: '玉泉区' },
                    { value: '赛罕区', label: '赛罕区' },
                    { value: '新城区', label: '新城区' },
                    { value: '土默特左旗', label: '土默特左旗' }
                ]
            },
            {
                value: '包头市', label: '包头市',
                children: [
                    { value: '东河区', label: '东河区' },
                    { value: '昆都仑区', label: '昆都仑区' },
                    { value: '青山区', label: '青山区' },
                    { value: '石拐区', label: '石拐区' },
                    { value: '白云鄂博矿区', label: '白云鄂博矿区' },
                    { value: '九原区', label: '九原区' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 广西壮族自治区
    // ============================================================
    {
        value: '广西壮族自治区', label: '广西壮族自治区',
        children: [
            {
                value: '南宁市', label: '南宁市',
                children: [
                    { value: '兴宁区', label: '兴宁区' },
                    { value: '青秀区', label: '青秀区' },
                    { value: '江南区', label: '江南区' },
                    { value: '西乡塘区', label: '西乡塘区' },
                    { value: '良庆区', label: '良庆区' },
                    { value: '邕宁区', label: '邕宁区' },
                    { value: '武鸣区', label: '武鸣区' }
                ]
            },
            {
                value: '柳州市', label: '柳州市',
                children: [
                    { value: '城中区', label: '城中区' },
                    { value: '鱼峰区', label: '鱼峰区' },
                    { value: '柳南区', label: '柳南区' },
                    { value: '柳北区', label: '柳北区' },
                    { value: '柳江区', label: '柳江区' }
                ]
            },
            {
                value: '桂林市', label: '桂林市',
                children: [
                    { value: '秀峰区', label: '秀峰区' },
                    { value: '叠彩区', label: '叠彩区' },
                    { value: '象山区', label: '象山区' },
                    { value: '七星区', label: '七星区' },
                    { value: '雁山区', label: '雁山区' },
                    { value: '临桂区', label: '临桂区' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 云南省
    // ============================================================
    {
        value: '云南省', label: '云南省',
        children: [
            {
                value: '昆明市', label: '昆明市',
                children: [
                    { value: '五华区', label: '五华区' },
                    { value: '盘龙区', label: '盘龙区' },
                    { value: '官渡区', label: '官渡区' },
                    { value: '西山区', label: '西山区' },
                    { value: '东川区', label: '东川区' },
                    { value: '呈贡区', label: '呈贡区' },
                    { value: '晋宁区', label: '晋宁区' },
                    { value: '富民县', label: '富民县' },
                    { value: '宜良县', label: '宜良县' },
                    { value: '安宁市', label: '安宁市' }
                ]
            },
            {
                value: '曲靖市', label: '曲靖市',
                children: [
                    { value: '麒麟区', label: '麒麟区' },
                    { value: '沾益区', label: '沾益区' },
                    { value: '马龙区', label: '马龙区' },
                    { value: '陆良县', label: '陆良县' },
                    { value: '宣威市', label: '宣威市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 贵州省
    // ============================================================
    {
        value: '贵州省', label: '贵州省',
        children: [
            {
                value: '贵阳市', label: '贵阳市',
                children: [
                    { value: '南明区', label: '南明区' },
                    { value: '云岩区', label: '云岩区' },
                    { value: '花溪区', label: '花溪区' },
                    { value: '乌当区', label: '乌当区' },
                    { value: '白云区', label: '白云区' },
                    { value: '观山湖区', label: '观山湖区' },
                    { value: '清镇市', label: '清镇市' }
                ]
            },
            {
                value: '遵义市', label: '遵义市',
                children: [
                    { value: '红花岗区', label: '红花岗区' },
                    { value: '汇川区', label: '汇川区' },
                    { value: '播州区', label: '播州区' },
                    { value: '赤水市', label: '赤水市' },
                    { value: '仁怀市', label: '仁怀市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 江西省
    // ============================================================
    {
        value: '江西省', label: '江西省',
        children: [
            {
                value: '南昌市', label: '南昌市',
                children: [
                    { value: '东湖区', label: '东湖区' },
                    { value: '西湖区', label: '西湖区' },
                    { value: '青云谱区', label: '青云谱区' },
                    { value: '湾里区', label: '湾里区' },
                    { value: '青山湖区', label: '青山湖区' },
                    { value: '新建区', label: '新建区' },
                    { value: '红谷滩区', label: '红谷滩区' },
                    { value: '安义县', label: '安义县' },
                    { value: '进贤县', label: '进贤县' }
                ]
            },
            {
                value: '赣州市', label: '赣州市',
                children: [
                    { value: '章贡区', label: '章贡区' },
                    { value: '南康区', label: '南康区' },
                    { value: '赣县区', label: '赣县区' },
                    { value: '信丰县', label: '信丰县' },
                    { value: '兴国县', label: '兴国县' }
                ]
            },
            {
                value: '九江市', label: '九江市',
                children: [
                    { value: '濂溪区', label: '濂溪区' },
                    { value: '浔阳区', label: '浔阳区' },
                    { value: '柴桑区', label: '柴桑区' },
                    { value: '武宁县', label: '武宁县' },
                    { value: '庐山市', label: '庐山市' },
                    { value: '共青城市', label: '共青城市' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 海南省
    // ============================================================
    {
        value: '海南省', label: '海南省',
        children: [
            {
                value: '海口市', label: '海口市',
                children: [
                    { value: '秀英区', label: '秀英区' },
                    { value: '龙华区', label: '龙华区' },
                    { value: '琼山区', label: '琼山区' },
                    { value: '美兰区', label: '美兰区' }
                ]
            },
            {
                value: '三亚市', label: '三亚市',
                children: [
                    { value: '海棠区', label: '海棠区' },
                    { value: '吉阳区', label: '吉阳区' },
                    { value: '天涯区', label: '天涯区' },
                    { value: '崖州区', label: '崖州区' }
                ]
            },
            {
                value: '三沙市', label: '三沙市',
                children: [
                    { value: '西沙区', label: '西沙区' },
                    { value: '南沙区', label: '南沙区' }
                ]
            },
            {
                value: '儋州市', label: '儋州市',
                children: [
                    { value: '那大镇', label: '那大镇' },
                    { value: '白马井镇', label: '白马井镇' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 新疆维吾尔自治区
    // ============================================================
    {
        value: '新疆维吾尔自治区', label: '新疆维吾尔自治区',
        children: [
            {
                value: '乌鲁木齐市', label: '乌鲁木齐市',
                children: [
                    { value: '天山区', label: '天山区' },
                    { value: '沙依巴克区', label: '沙依巴克区' },
                    { value: '新市区', label: '新市区' },
                    { value: '水磨沟区', label: '水磨沟区' },
                    { value: '头屯河区', label: '头屯河区' },
                    { value: '达坂城区', label: '达坂城区' },
                    { value: '米东区', label: '米东区' }
                ]
            },
            {
                value: '喀什地区', label: '喀什地区',
                children: [
                    { value: '喀什市', label: '喀什市' },
                    { value: '疏附县', label: '疏附县' },
                    { value: '疏勒县', label: '疏勒县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 西藏自治区
    // ============================================================
    {
        value: '西藏自治区', label: '西藏自治区',
        children: [
            {
                value: '拉萨市', label: '拉萨市',
                children: [
                    { value: '城关区', label: '城关区' },
                    { value: '堆龙德庆区', label: '堆龙德庆区' },
                    { value: '达孜区', label: '达孜区' },
                    { value: '林周县', label: '林周县' },
                    { value: '当雄县', label: '当雄县' },
                    { value: '尼木县', label: '尼木县' },
                    { value: '曲水县', label: '曲水县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 甘肃省
    // ============================================================
    {
        value: '甘肃省', label: '甘肃省',
        children: [
            {
                value: '兰州市', label: '兰州市',
                children: [
                    { value: '城关区', label: '城关区' },
                    { value: '七里河区', label: '七里河区' },
                    { value: '西固区', label: '西固区' },
                    { value: '安宁区', label: '安宁区' },
                    { value: '红古区', label: '红古区' },
                    { value: '永登县', label: '永登县' },
                    { value: '榆中县', label: '榆中县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 青海省
    // ============================================================
    {
        value: '青海省', label: '青海省',
        children: [
            {
                value: '西宁市', label: '西宁市',
                children: [
                    { value: '城东区', label: '城东区' },
                    { value: '城中区', label: '城中区' },
                    { value: '城西区', label: '城西区' },
                    { value: '城北区', label: '城北区' },
                    { value: '湟中区', label: '湟中区' },
                    { value: '大通回族土族自治县', label: '大通回族土族自治县' }
                ]
            }
        ]
    },

    // ============================================================
    // 📍 宁夏回族自治区
    // ============================================================
    {
        value: '宁夏回族自治区', label: '宁夏回族自治区',
        children: [
            {
                value: '银川市', label: '银川市',
                children: [
                    { value: '兴庆区', label: '兴庆区' },
                    { value: '西夏区', label: '西夏区' },
                    { value: '金凤区', label: '金凤区' },
                    { value: '永宁县', label: '永宁县' },
                    { value: '贺兰县', label: '贺兰县' },
                    { value: '灵武市', label: '灵武市' }
                ]
            }
        ]
    }
]