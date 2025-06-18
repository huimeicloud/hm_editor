// mock.js - 提供mock搜索接口注册方法
var express = require('express');
var router = express.Router();

// 医护人员mock搜索接口
router.post('/search/test', function(req, res) {
    var searchText = req.body.searchText || '';
    var result = [];
    var mockData = [
        { code: "D01", name: "张医生", displayVal: "张医生(外科主任)", inputpy: "ZYS" },
        { code: "D02", name: "李医生", displayVal: "李医生(内科副主任)", inputpy: "LYS" },
        { code: "D03", name: "王医生", displayVal: "王医生(儿科主任)", inputpy: "WYS" },
        { code: "D04", name: "赵医生", displayVal: "赵医生(骨科主任)", inputpy: "ZYS" },
        { code: "D05", name: "刘医生", displayVal: "刘医生(神经外科主任)", inputpy: "LYS" },
        { code: "D06", name: "陈医生", displayVal: "陈医生(心胸外科副主任)", inputpy: "CYS" },
        { code: "D07", name: "杨医生", displayVal: "杨医生(消化内科主任)", inputpy: "YYS" },
        { code: "D08", name: "吴医生", displayVal: "吴医生(呼吸内科主任)", inputpy: "WYS" },
        { code: "D09", name: "黄医生", displayVal: "黄医生(妇产科主任)", inputpy: "HYS" },
        { code: "D10", name: "周医生", displayVal: "周医生(眼科主任)", inputpy: "ZYS" },
        { code: "D11", name: "吕医生", displayVal: "吕医生(口腔科副主任)", inputpy: "LYS" },
        { code: "D12", name: "郑医生", displayVal: "郑医生(皮肤科副主任)", inputpy: "ZYS" },
        { code: "D13", name: "钱医生", displayVal: "钱医生(泌尿外科主任)", inputpy: "QYS" },
        { code: "D14", name: "孙医生", displayVal: "孙医生(肿瘤科主任)", inputpy: "SYS" },
        { code: "D15", name: "马医生", displayVal: "马医生(血液科副主任)", inputpy: "MYS" },
        { code: "N01", name: "张护士", displayVal: "张护士(外科护士长)", inputpy: "ZHS" },
        { code: "N02", name: "李护士", displayVal: "李护士(内科护士长)", inputpy: "LHS" },
        { code: "N03", name: "王护士", displayVal: "王护士(儿科护士长)", inputpy: "WHS" },
        { code: "N04", name: "赵护士", displayVal: "赵护士(骨科护士)", inputpy: "ZHS" },
        { code: "N05", name: "刘护士", displayVal: "刘护士(神经外科护士)", inputpy: "LHS" }
    ];
    if (searchText) {
        var st = searchText.toUpperCase();
        result = [];
        for (var i = 0; i < mockData.length; i++) {
            var item = mockData[i];
            if ((item.code && item.code.toLowerCase().indexOf(searchText.toLowerCase()) !== -1) ||
                (item.name && item.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1) ||
                (item.displayVal && item.displayVal.toLowerCase().indexOf(searchText.toLowerCase()) !== -1) ||
                (item.inputpy && item.inputpy.toLowerCase().indexOf(searchText.toLowerCase()) !== -1)) {
                result.push(item);
            }
        }
    } else {
        result = mockData;
    }
    if (result.length > 20) {
        result = result.slice(0, 20);
    }
    res.json({ code: 10000, message: "success", data: result });
});

// 省市县数据直接加inputpy字段（拼音首字母大写）
var provinces = [
    { code: '110000', name: '北京市', inputpy: 'BJS' },
    { code: '120000', name: '天津市', inputpy: 'TJS' },
    { code: '310000', name: '上海市', inputpy: 'SHS' },
    { code: '500000', name: '重庆市', inputpy: 'CQS' },
    { code: '440000', name: '广东省', inputpy: 'GDS' },
    { code: '320000', name: '江苏省', inputpy: 'JSS' },
    { code: '330000', name: '浙江省', inputpy: 'ZJS' },
    { code: '370000', name: '山东省', inputpy: 'SDS' },
    { code: '510000', name: '四川省', inputpy: 'SCS' },
    { code: '410000', name: '河南省', inputpy: 'HNS' },
    { code: '420000', name: '湖北省', inputpy: 'HBS' },
    { code: '430000', name: '湖南省', inputpy: 'HNS' },
    { code: '610000', name: '陕西省', inputpy: 'SXS' },
    { code: '350000', name: '福建省', inputpy: 'FJS' },
    { code: '450000', name: '广西壮族自治区', inputpy: 'GXZZZZQ' },
    { code: '530000', name: '云南省', inputpy: 'YNS' },
    { code: '520000', name: '贵州省', inputpy: 'GZS' },
    { code: '210000', name: '辽宁省', inputpy: 'LNS' },
    { code: '220000', name: '吉林省', inputpy: 'JLS' },
    { code: '230000', name: '黑龙江省', inputpy: 'HLJS' },
    { code: '140000', name: '山西省', inputpy: 'SXS' },
    { code: '150000', name: '内蒙古自治区', inputpy: 'NMGZZQ' },
    { code: '360000', name: '江西省', inputpy: 'JXS' },
    { code: '340000', name: '安徽省', inputpy: 'AHS' },
    { code: '460000', name: '海南省', inputpy: 'HNS' },
    { code: '630000', name: '青海省', inputpy: 'QHS' },
    { code: '640000', name: '宁夏回族自治区', inputpy: 'NXHZZQ' },
    { code: '650000', name: '新疆维吾尔自治区', inputpy: 'XJWWEZZQ' },
    { code: '540000', name: '西藏自治区', inputpy: 'XZZQ' },
    { code: '810000', name: '香港特别行政区', inputpy: 'XGTBXZQ' },
    { code: '820000', name: '澳门特别行政区', inputpy: 'AMTBXZQ' },
    { code: '710000', name: '台湾省', inputpy: 'TWS' }
];
// 每省2市
var cities = {
    '110000': [{ code: '110100', name: '北京市', inputpy: 'BJS' }],
    '120000': [{ code: '120100', name: '天津市', inputpy: 'TJS' }],
    '310000': [{ code: '310100', name: '上海市', inputpy: 'SHS' }],
    '500000': [{ code: '500100', name: '重庆市', inputpy: 'CQS' }],
    '440000': [{ code: '440100', name: '广州市', inputpy: 'GZS' }],
    '320000': [{ code: '320100', name: '南京市', inputpy: 'NJS' }],
    '330000': [{ code: '330100', name: '杭州市', inputpy: 'HZS' }],
    '370000': [{ code: '370100', name: '济南市', inputpy: 'JNS' }],
    '510000': [{ code: '510100', name: '成都市', inputpy: 'CDS' }],
    '410000': [{ code: '410100', name: '郑州市', inputpy: 'ZZS' }],
    '420000': [{ code: '420100', name: '武汉市', inputpy: 'WHS' }],
    '430000': [{ code: '430100', name: '长沙市', inputpy: 'CSS' }],
    '610000': [{ code: '610100', name: '西安市', inputpy: 'XAS' }],
    '350000': [{ code: '350100', name: '福州市', inputpy: 'FZS' }],
    '450000': [{ code: '450100', name: '南宁市', inputpy: 'NNS' }],
    '530000': [{ code: '530100', name: '昆明市', inputpy: 'KMS' }],
    '520000': [{ code: '520100', name: '贵阳市', inputpy: 'GYS' }],
    '210000': [{ code: '210100', name: '沈阳市', inputpy: 'SYS' }],
    '220000': [{ code: '220100', name: '长春市', inputpy: 'CCS' }],
    '230000': [{ code: '230100', name: '哈尔滨市', inputpy: 'HEBS' }],
    '140000': [{ code: '140100', name: '太原市', inputpy: 'TYS' }],
    '150000': [{ code: '150100', name: '呼和浩特市', inputpy: 'HHHTS' }],
    '360000': [{ code: '360100', name: '南昌市', inputpy: 'NCS' }],
    '340000': [{ code: '340100', name: '合肥市', inputpy: 'HFS' }],
    '460000': [{ code: '460100', name: '海口市', inputpy: 'HKS' }],
    '630000': [{ code: '630100', name: '西宁市', inputpy: 'XNS' }],
    '640000': [{ code: '640100', name: '银川市', inputpy: 'YCS' }],
    '650000': [{ code: '650100', name: '乌鲁木齐市', inputpy: 'WLMQS' }],
    '540000': [{ code: '540100', name: '拉萨市', inputpy: 'LSS' }],
    '810000': [{ code: '810001', name: '香港岛', inputpy: 'XGD' }],
    '820000': [{ code: '820001', name: '澳门半岛', inputpy: 'AMBD' }],
    '710000': [{ code: '710100', name: '台北市', inputpy: 'TBS' }]
};
// 每市8县
var counties = {
    '110100': [
        { code: '110101', name: '东城区', inputpy: 'DCC' },
        { code: '110102', name: '西城区', inputpy: 'XCC' },
        { code: '110105', name: '朝阳区', inputpy: 'CYQ' }
    ],
    '120100': [
        { code: '120101', name: '和平区', inputpy: 'HPQ' },
        { code: '120102', name: '河东区', inputpy: 'HDQ' },
        { code: '120103', name: '河西区', inputpy: 'HXQ' }
    ],
    '310100': [
        { code: '310101', name: '黄浦区', inputpy: 'HPQ' },
        { code: '310104', name: '徐汇区', inputpy: 'XHQ' },
        { code: '310105', name: '长宁区', inputpy: 'CNQ' }
    ],
    '500100': [
        { code: '500101', name: '万州区', inputpy: 'WZQ' },
        { code: '500102', name: '涪陵区', inputpy: 'FLQ' },
        { code: '500103', name: '渝中区', inputpy: 'YZQ' }
    ],
    '440100': [
        { code: '440103', name: '荔湾区', inputpy: 'LWQ' },
        { code: '440104', name: '越秀区', inputpy: 'YXQ' },
        { code: '440105', name: '海珠区', inputpy: 'HZQ' }
    ],
    '320100': [
        { code: '320102', name: '玄武区', inputpy: 'XWQ' },
        { code: '320104', name: '秦淮区', inputpy: 'QHQ' },
        { code: '320105', name: '建邺区', inputpy: 'JYQ' }
    ],
    '330100': [
        { code: '330102', name: '上城区', inputpy: 'SCC' },
        { code: '330103', name: '下城区', inputpy: 'XCC' },
        { code: '330104', name: '江干区', inputpy: 'JGQ' }
    ],
    '370100': [
        { code: '370102', name: '历下区', inputpy: 'LXQ' },
        { code: '370103', name: '市中区', inputpy: 'SZQ' },
        { code: '370104', name: '槐荫区', inputpy: 'HYQ' }
    ],
    '510100': [
        { code: '510104', name: '锦江区', inputpy: 'JJQ' },
        { code: '510105', name: '青羊区', inputpy: 'QYQ' },
        { code: '510106', name: '金牛区', inputpy: 'JNQ' }
    ],
    '410100': [
        { code: '410102', name: '中原区', inputpy: 'ZYQ' },
        { code: '410103', name: '二七区', inputpy: 'EQQ' },
        { code: '410104', name: '管城回族区', inputpy: 'GCHZQ' }
    ],
    '420100': [
        { code: '420102', name: '江岸区', inputpy: 'JAQ' },
        { code: '420103', name: '江汉区', inputpy: 'JHQ' },
        { code: '420104', name: '硚口区', inputpy: 'QKQ' }
    ],
    '430100': [
        { code: '430102', name: '芙蓉区', inputpy: 'FRQ' },
        { code: '430103', name: '天心区', inputpy: 'TXQ' },
        { code: '430104', name: '岳麓区', inputpy: 'YLQ' }
    ],
    '610100': [
        { code: '610102', name: '新城区', inputpy: 'XCC' },
        { code: '610103', name: '碑林区', inputpy: 'BLQ' },
        { code: '610104', name: '莲湖区', inputpy: 'LHQ' }
    ],
    '350100': [
        { code: '350102', name: '鼓楼区', inputpy: 'GLQ' },
        { code: '350103', name: '台江区', inputpy: 'TJQ' },
        { code: '350104', name: '仓山区', inputpy: 'CSQ' }
    ],
    '450100': [
        { code: '450102', name: '兴宁区', inputpy: 'XNQ' },
        { code: '450103', name: '青秀区', inputpy: 'QXQ' },
        { code: '450105', name: '江南区', inputpy: 'JNQ' }
    ],
    '530100': [
        { code: '530102', name: '五华区', inputpy: 'WHQ' },
        { code: '530103', name: '盘龙区', inputpy: 'PLQ' },
        { code: '530111', name: '官渡区', inputpy: 'GDQ' }
    ],
    '520100': [
        { code: '520102', name: '南明区', inputpy: 'NMQ' },
        { code: '520103', name: '云岩区', inputpy: 'YYQ' },
        { code: '520111', name: '花溪区', inputpy: 'HXQ' }
    ],
    '210100': [
        { code: '210102', name: '和平区', inputpy: 'HPQ' },
        { code: '210103', name: '沈河区', inputpy: 'SHQ' },
        { code: '210104', name: '大东区', inputpy: 'DDQ' }
    ],
    '220100': [
        { code: '220102', name: '南关区', inputpy: 'NGQ' },
        { code: '220103', name: '宽城区', inputpy: 'KCC' },
        { code: '220104', name: '朝阳区', inputpy: 'CYQ' }
    ],
    '230100': [
        { code: '230102', name: '道里区', inputpy: 'DLQ' },
        { code: '230103', name: '南岗区', inputpy: 'NGQ' },
        { code: '230104', name: '道外区', inputpy: 'DWQ' }
    ],
    '140100': [
        { code: '140105', name: '小店区', inputpy: 'XDQ' },
        { code: '140106', name: '迎泽区', inputpy: 'YZQ' },
        { code: '140107', name: '杏花岭区', inputpy: 'XHLQ' }
    ],
    '150100': [
        { code: '150102', name: '新城区', inputpy: 'XCC' },
        { code: '150103', name: '回民区', inputpy: 'HMQ' },
        { code: '150104', name: '玉泉区', inputpy: 'YQQ' }
    ],
    '360100': [
        { code: '360102', name: '东湖区', inputpy: 'DHQ' },
        { code: '360103', name: '西湖区', inputpy: 'XHQ' },
        { code: '360104', name: '青云谱区', inputpy: 'QYPQ' }
    ],
    '340100': [
        { code: '340102', name: '瑶海区', inputpy: 'YHQ' },
        { code: '340103', name: '庐阳区', inputpy: 'LYQ' },
        { code: '340104', name: '蜀山区', inputpy: 'SSQ' }
    ],
    '460100': [
        { code: '460105', name: '秀英区', inputpy: 'XYQ' },
        { code: '460106', name: '龙华区', inputpy: 'LHQ' },
        { code: '460107', name: '琼山区', inputpy: 'QSQ' }
    ],
    '630100': [
        { code: '630102', name: '城东区', inputpy: 'CDQ' },
        { code: '630103', name: '城中区', inputpy: 'CZQ' },
        { code: '630104', name: '城西区', inputpy: 'CXQ' }
    ],
    '640100': [
        { code: '640104', name: '兴庆区', inputpy: 'XQQ' },
        { code: '640105', name: '西夏区', inputpy: 'XXQ' },
        { code: '640106', name: '金凤区', inputpy: 'JFQ' }
    ],
    '650100': [
        { code: '650102', name: '天山区', inputpy: 'TSQ' },
        { code: '650103', name: '沙依巴克区', inputpy: 'SYBKQ' },
        { code: '650104', name: '新市区', inputpy: 'XSQ' }
    ],
    '540100': [
        { code: '540102', name: '城关区', inputpy: 'CGQ' },
        { code: '540103', name: '堆龙德庆区', inputpy: 'DLDQQ' },
        { code: '540104', name: '达孜区', inputpy: 'DZQ' }
    ],
    '810001': [
        { code: '810002', name: '中西区', inputpy: 'ZXQ' },
        { code: '810003', name: '湾仔区', inputpy: 'WZQ' },
        { code: '810004', name: '东区', inputpy: 'DQ' }
    ],
    '820001': [
        { code: '820002', name: '花地玛堂区', inputpy: 'HDMTQ' },
        { code: '820003', name: '圣安多尼堂区', inputpy: 'SADNTQ' },
        { code: '820004', name: '大堂区', inputpy: 'DTQ' }
    ],
    '710100': [
        { code: '710101', name: '中正区', inputpy: 'ZZQ' },
        { code: '710102', name: '大同区', inputpy: 'DTQ' },
        { code: '710103', name: '中山区', inputpy: 'ZSQ' }
    ]
};

router.post('/search/area/:areaType', function(req, res) {
    var areaType = parseInt(req.params.areaType, 10);
    var province = req.body.province;
    var city = req.body.city;
    var searchText = req.body.searchText || '';
    var data = [];
    if (areaType === 1) { // 省
        data = provinces;
    } else if (areaType === 2) { // 市
        if (province) {
            var provinceCode = province;
            var found = null;
            for (var i = 0; i < provinces.length; i++) {
                if (provinces[i].code === province) {
                    found = provinces[i];
                    break;
                }
            }
            if (!found) {
                for (var i = 0; i < provinces.length; i++) {
                    if (provinces[i].name === province) {
                        provinceCode = provinces[i].code;
                        break;
                    }
                }
            }
            data = cities[provinceCode] || [];
        } else {
            // province 为空，返回所有市
            data = [];
            for (var k in cities) {
                for (var j = 0; j < cities[k].length; j++) {
                    data.push(cities[k][j]);
                }
            }
        }
    } else if (areaType === 3) { // 县
        if (city) {
            var cityCode = city;
            var foundCode = null;
            if (!cities[cityCode] && !counties[cityCode]) {
                for (var k in cities) {
                    if (cities[k][0] && cities[k][0].name === city) {
                        foundCode = cities[k][0].code;
                    }
                }
                if (!foundCode) {
                    for (var k in counties) {
                        if (counties[k][0] && counties[k][0].name === city) {
                            foundCode = counties[k][0].code;
                        }
                    }
                }
                if (foundCode) cityCode = foundCode;
            }
            data = counties[cityCode] || [];
        } else {
            // city 为空，返回所有县
            data = [];
            for (var k in counties) {
                for (var j = 0; j < counties[k].length; j++) {
                    data.push(counties[k][j]);
                }
            }
        }
    }
    if (searchText) {
        var st = searchText.toUpperCase();
        var filtered = [];
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if ((item.name && item.name.indexOf(searchText) !== -1) ||
                (item.code && item.code.indexOf(searchText) !== -1) ||
                (item.inputpy && item.inputpy.indexOf(st) !== -1)) {
                filtered.push(item);
            }
        }
        data = filtered;
    }
    res.json({ code: 10000, message: "success", data: data });
});

// ICD10诊断mock搜索接口（50条常见病）
var icd10MockData = [
    { code: 'I10', name: '原发性高血压', displayVal: '原发性高血压(I10)', inputpy: 'YFXGXY' },
    { code: 'E11', name: '2型糖尿病', displayVal: '2型糖尿病(E11)', inputpy: '2XTNB' },
    { code: 'I25.101', name: '冠状动脉粥样硬化性心脏病', displayVal: '冠状动脉粥样硬化性心脏病(I25.101)', inputpy: 'GZDMZYHHXXZB' },
    { code: 'I63.901', name: '脑梗死', displayVal: '脑梗死(I63.901)', inputpy: 'NGS' },
    { code: 'J18.901', name: '肺炎', displayVal: '肺炎(J18.901)', inputpy: 'FY' },
    { code: 'K29.501', name: '慢性胃炎', displayVal: '慢性胃炎(K29.501)', inputpy: 'MXWY' },
    { code: 'K81.101', name: '急性胆囊炎', displayVal: '急性胆囊炎(K81.101)', inputpy: 'JXDNY' },
    { code: 'K35.801', name: '急性阑尾炎', displayVal: '急性阑尾炎(K35.801)', inputpy: 'JXLWY' },
    { code: 'N20.000', name: '肾结石', displayVal: '肾结石(N20.000)', inputpy: 'SJS' },
    { code: 'S52.501', name: '桡骨远端骨折', displayVal: '桡骨远端骨折(S52.501)', inputpy: 'RGYDGZ' },
    { code: 'C34.901', name: '肺癌', displayVal: '肺癌(C34.901)', inputpy: 'FA' },
    { code: 'C16.901', name: '胃癌', displayVal: '胃癌(C16.901)', inputpy: 'WA' },
    { code: 'C18.901', name: '结肠癌', displayVal: '结肠癌(C18.901)', inputpy: 'JCA' },
    { code: 'C50.901', name: '乳腺癌', displayVal: '乳腺癌(C50.901)', inputpy: 'RXA' },
    { code: 'C61', name: '前列腺癌', displayVal: '前列腺癌(C61)', inputpy: 'QLXA' },
    { code: 'J45.900', name: '哮喘', displayVal: '哮喘(J45.900)', inputpy: 'XC' },
    { code: 'J44.900', name: '慢性阻塞性肺疾病', displayVal: '慢性阻塞性肺疾病(J44.900)', inputpy: 'MXZSXFDJB' },
    { code: 'K80.100', name: '胆囊结石', displayVal: '胆囊结石(K80.100)', inputpy: 'DNJS' },
    { code: 'K25.900', name: '胃溃疡', displayVal: '胃溃疡(K25.900)', inputpy: 'WKY' },
    { code: 'K40.900', name: '腹股沟疝', displayVal: '腹股沟疝(K40.900)', inputpy: 'FGGX' },
    { code: 'M54.500', name: '腰椎间盘突出', displayVal: '腰椎间盘突出(M54.500)', inputpy: 'YZJPTC' },
    { code: 'M17.900', name: '膝关节骨关节炎', displayVal: '膝关节骨关节炎(M17.900)', inputpy: 'XGJGJY' },
    { code: 'M16.900', name: '髋关节骨关节炎', displayVal: '髋关节骨关节炎(M16.900)', inputpy: 'KGJGJY' },
    { code: 'N39.000', name: '尿路感染', displayVal: '尿路感染(N39.000)', inputpy: 'NLGY' },
    { code: 'N40.900', name: '前列腺增生', displayVal: '前列腺增生(N40.900)', inputpy: 'QLXZS' },
    { code: 'N18.900', name: '慢性肾功能衰竭', displayVal: '慢性肾功能衰竭(N18.900)', inputpy: 'MXSGNSJ' },
    { code: 'E78.500', name: '高脂血症', displayVal: '高脂血症(E78.500)', inputpy: 'GZXZ' },
    { code: 'E66.900', name: '肥胖症', displayVal: '肥胖症(E66.900)', inputpy: 'FPZ' },
    { code: 'E03.900', name: '甲状腺功能减退症', displayVal: '甲状腺功能减退症(E03.900)', inputpy: 'JZXGNJTZ' },
    { code: 'E05.900', name: '甲状腺功能亢进症', displayVal: '甲状腺功能亢进症(E05.900)', inputpy: 'JZXGNKJZ' },
    { code: 'F32.900', name: '抑郁症', displayVal: '抑郁症(F32.900)', inputpy: 'YYZ' },
    { code: 'F41.100', name: '焦虑症', displayVal: '焦虑症(F41.100)', inputpy: 'JLZ' },
    { code: 'G40.900', name: '癫痫', displayVal: '癫痫(G40.900)', inputpy: 'DX' },
    { code: 'G20', name: '帕金森病', displayVal: '帕金森病(G20)', inputpy: 'PJSB' },
    { code: 'H25.900', name: '白内障', displayVal: '白内障(H25.900)', inputpy: 'BNZ' },
    { code: 'H40.900', name: '青光眼', displayVal: '青光眼(H40.900)', inputpy: 'QGY' },
    { code: 'I21.900', name: '急性心肌梗死', displayVal: '急性心肌梗死(I21.900)', inputpy: 'JXXJGS' },
    { code: 'I50.900', name: '心力衰竭', displayVal: '心力衰竭(I50.900)', inputpy: 'XLSJ' },
    { code: 'J06.900', name: '急性上呼吸道感染', displayVal: '急性上呼吸道感染(J06.900)', inputpy: 'JXSHXDGY' },
    { code: 'J03.900', name: '急性扁桃体炎', displayVal: '急性扁桃体炎(J03.900)', inputpy: 'JXBTTY' },
    { code: 'J20.900', name: '急性支气管炎', displayVal: '急性支气管炎(J20.900)', inputpy: 'JXZQGY' },
    { code: 'J42.900', name: '慢性支气管炎', displayVal: '慢性支气管炎(J42.900)', inputpy: 'MXZQGY' },
    { code: 'K52.900', name: '非感染性胃肠炎', displayVal: '非感染性胃肠炎(K52.900)', inputpy: 'FGRXWCY' },
    { code: 'K59.900', name: '便秘', displayVal: '便秘(K59.900)', inputpy: 'BM' },
    { code: 'K85.900', name: '急性胰腺炎', displayVal: '急性胰腺炎(K85.900)', inputpy: 'JXYXY' },
    { code: 'L03.900', name: '蜂窝织炎', displayVal: '蜂窝织炎(L03.900)', inputpy: 'FWZY' },
    { code: 'L40.900', name: '银屑病', displayVal: '银屑病(L40.900)', inputpy: 'YXB' },
    { code: 'M05.900', name: '类风湿关节炎', displayVal: '类风湿关节炎(M05.900)', inputpy: 'LFSGJY' },
    { code: 'M81.900', name: '骨质疏松症', displayVal: '骨质疏松症(M81.900)', inputpy: 'GZSSZ' },
    { code: 'N80.900', name: '子宫内膜异位症', displayVal: '子宫内膜异位症(N80.900)', inputpy: 'ZGNMYWZ' }
];
router.post('/search/icd10', function(req, res) {
    var searchText = req.body.searchText || '';
    var data = icd10MockData;
    if (searchText) {
        data = [];
        for (var i = 0; i < icd10MockData.length; i++) {
            var item = icd10MockData[i];
            if (item.code.includes(searchText) ||
                item.name.includes(searchText) ||
                item.displayVal.includes(searchText) ||
                item.inputpy.includes(searchText)) {
                data.push(item);
            }
        }
    }
    res.json({ code: 10000, message: "success", data });
});

// ICD9手术字典mock搜索接口（50条常见手术）
var icd9MockData = [
    { code: '00.1000', name: '化学治疗物质植入', displayVal: '化学治疗物质植入(00.1000)', inputpy: 'HXZL WZZR' },
    { code: '00.5000', name: '心脏再同步起搏器置入', displayVal: '心脏再同步起搏器置入(00.5000)', inputpy: 'XZZTBQBQZR' },
    { code: '00.7000', name: '髋关节置换修复术', displayVal: '髋关节置换修复术(00.7000)', inputpy: 'KGJZHXFS' },
    { code: '00.8000', name: '膝关节置换修复术', displayVal: '膝关节置换修复术(00.8000)', inputpy: 'XGJZHXFS' },
    { code: '00.9100', name: '与供者有血缘关系的活体移植', displayVal: '与供者有血缘关系的活体移植(00.9100)', inputpy: 'YGZ YXYGX DHTYZ' },
    { code: '00.9200', name: '与供者无血缘关系的活体移植', displayVal: '与供者无血缘关系的活体移植(00.9200)', inputpy: 'YGZ WXYGX DHTYZ' },
    { code: '00.1400', name: '噁唑烷酮类抗生素注射或输注', displayVal: '噁唑烷酮类抗生素注射或输注(00.1400)', inputpy: 'EZW TLKSS ZSHSZ' },
    { code: '00.1500', name: '大剂量白细胞介素-2[IL-2]输注', displayVal: '大剂量白细胞介素-2[IL-2]输注(00.1500)', inputpy: 'DJL BXBS JS2 SZ' },
    { code: '00.1600', name: '药物的静脉旁路移植加压疗法', displayVal: '药物的静脉旁路移植加压疗法(00.1600)', inputpy: 'YWD JMP LYZ JYLF' },
    { code: '00.1800', name: '输注免疫抑制抗体疗法', displayVal: '输注免疫抑制抗体疗法(00.1800)', inputpy: 'SZ MYYZ KT LF' },
    { code: '00.2100', name: '颅外脑血管的血管内显像', displayVal: '颅外脑血管的血管内显像(00.2100)', inputpy: 'LWNXG DXGNXX' },
    { code: '00.2400', name: '冠状血管的血管内显像', displayVal: '冠状血管的血管内显像(00.2400)', inputpy: 'GZXG DXGNXX' },
    { code: '00.5001', name: '心脏再同步起搏器置入术', displayVal: '心脏再同步起搏器置入术(00.5001)', inputpy: 'XZZTBQBQZRS' },
    { code: '00.5100', name: '心脏再同步除颤器置入', displayVal: '心脏再同步除颤器置入(00.5100)', inputpy: 'XZZTBQCQZR' },
    { code: '00.5300', name: '仅置入或置换心脏再同步起搏器脉冲发生器', displayVal: '仅置入或置换心脏再同步起搏器脉冲发生器(00.5300)', inputpy: 'JZR HZH XZZTBQBQ MCFSQ' },
    { code: '00.5400', name: '仅置入或置换心脏再同步除颤器脉冲发生器装置', displayVal: '仅置入或置换心脏再同步除颤器脉冲发生器装置(00.5400)', inputpy: 'JZR HZH XZZTBQCQ MCFSQZZ' },
    { code: '00.5500', name: '其他周围血管药物洗脱支架置入', displayVal: '其他周围血管药物洗脱支架置入(00.5500)', inputpy: 'QTZWXG YWXT ZJZR' },
    { code: '00.6000', name: '表浅股动脉药物洗脱支架置入', displayVal: '表浅股动脉药物洗脱支架置入(00.6000)', inputpy: 'BQGDM YWXT ZJZR' },
    { code: '00.6100', name: '颅外血管经皮血管成形术', displayVal: '颅外血管经皮血管成形术(00.6100)', inputpy: 'LWXG JQXGCXS' },
    { code: '00.6200', name: '颅内血管经皮血管成形术', displayVal: '颅内血管经皮血管成形术(00.6200)', inputpy: 'LNXG JQXGCXS' },
    { code: '00.6300', name: '颈动脉支架经皮置入术', displayVal: '颈动脉支架经皮置入术(00.6300)', inputpy: 'JDM ZJ JQZRS' },
    { code: '00.6500', name: '颅内血管支架经皮置入', displayVal: '颅内血管支架经皮置入(00.6500)', inputpy: 'LNXG ZJ JQZR' },
    { code: '00.6600', name: '经皮冠状动脉腔内血管成形术', displayVal: '经皮冠状动脉腔内血管成形术(00.6600)', inputpy: 'JQGZDM QNXGCXS' },
    { code: '00.7000', name: '髋关节置换修复术', displayVal: '髋关节置换修复术(00.7000)', inputpy: 'KGJZHXFS' },
    { code: '00.8000', name: '膝关节置换修复术', displayVal: '膝关节置换修复术(00.8000)', inputpy: 'XGJZHXFS' },
    { code: '00.8500', name: '髋关节表面置换', displayVal: '髋关节表面置换(00.8500)', inputpy: 'KGJBMZH' },
    { code: '00.8600', name: '髋关节表面置换，部分的，股骨头', displayVal: '髋关节表面置换，部分的，股骨头(00.8600)', inputpy: 'KGJBMZH BFD GGT' },
    { code: '00.9100', name: '与供者有血缘关系的活体移植', displayVal: '与供者有血缘关系的活体移植(00.9100)', inputpy: 'YGZ YXYGX DHTYZ' },
    { code: '00.9200', name: '与供者无血缘关系的活体移植', displayVal: '与供者无血缘关系的活体移植(00.9200)', inputpy: 'YGZ WXYGX DHTYZ' },
    { code: '03.0', name: '脊髓切开术', displayVal: '脊髓切开术(03.0)', inputpy: 'JSQKS' },
    { code: '35.1', name: '心脏瓣膜置换术', displayVal: '心脏瓣膜置换术(35.1)', inputpy: 'XZBMZHS' },
    { code: '37.2', name: '冠状动脉搭桥术', displayVal: '冠状动脉搭桥术(37.2)', inputpy: 'GZDM DQS' },
    { code: '44.1', name: '胃切除术', displayVal: '胃切除术(44.1)', inputpy: 'WQCS' },
    { code: '47.0', name: '阑尾切除术', displayVal: '阑尾切除术(47.0)', inputpy: 'LWQCS' },
    { code: '51.22', name: '胆囊切除术', displayVal: '胆囊切除术(51.22)', inputpy: 'DNQCS' },
    { code: '54.5', name: '腹腔镜检查', displayVal: '腹腔镜检查(54.5)', inputpy: 'FQJJC' },
    { code: '68.4', name: '剖宫产', displayVal: '剖宫产(68.4)', inputpy: 'PGC' },
    { code: '79.39', name: '骨折内固定术', displayVal: '骨折内固定术(79.39)', inputpy: 'GZNGDS' },
    { code: '81.54', name: '人工膝关节置换术', displayVal: '人工膝关节置换术(81.54)', inputpy: 'RGXGJZHS' }
    // ...如需更多可继续补充
];
router.post('/search/icd9', function(req, res) {
    var searchText = req.body.searchText || '';
    var data = icd9MockData;
    if (searchText) {
        data = [];
        for (var i = 0; i < icd9MockData.length; i++) {
            var item = icd9MockData[i];
            if (item.code.includes(searchText) ||
                item.name.includes(searchText) ||
                item.displayVal.includes(searchText) ||
                item.inputpy.includes(searchText)) {
                data.push(item);
            }
        }
    }
    res.json({ code: 10000, message: "success", data });
});

module.exports = router;