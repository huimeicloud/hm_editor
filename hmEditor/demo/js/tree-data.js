/**
 * 文档树结构数据
 * 用于HM Editor Demo中的文档树管理
 */
const documentTreeData = [
    //{
    //     id: 'medical_record', // 测试case
    //     docName: '测试病历数据元',
    //     type: 'folder',
    //     children: [{
    //         docCode: 'template1749724711692',
    //         docPath: 'file/testRecord.html',
    //         docName: '测试病历数据元',
    //         type: 'file-edit'
    //     }]
    // },
    {
       id: 'medical_record',
       docName: '病案首页',
       type: 'folder',
       children: [{
           docCode: 'inpatient_record',
           docPath: 'file/inpatient_record.html',
           docName: '住院病案首页',
           type: 'file-edit'
       }]
    },
    {
        id: 'admission_record',
        docName: '入院记录',
        type: 'folder',
        children: [{
                docCode: 'admission_record_1',
                docPath: 'file/admission_record.html',
                docName: '入院记录',
                type: 'file-edit'
            },
            {
                docCode: 'admission_24h',
                docPath: 'file/admission_24h.html',
                docName: '24小时内入出院记录',
                type: 'file-edit'
            },
            {
                docCode: 'admission_24h_death',
                docPath: 'file/admission_24h_death.html',
                docName: '24小时出入院死亡记录',
                type: 'file-edit'
            }
        ]
    },
    {
        id: 'progress_record',
        docName: '病程记录',
        type: 'folder',
        children: [{
                docCode: 'first_progress',
                docPath: 'file/first_progress.html',
                docName: '首次病程记录',
                type: 'file-edit'
            },
            {
                docCode: 'daily_progress_1',
                docPath: 'file/daily_progress_1.html',
                docName: '日常病程记录',
                type: 'file-edit'
            },
            {
                docCode: 'consultation_record',
                docPath: 'file/daily_progress_3.html',
                docName: '主治医生查房记录',
                type: 'file-edit'
            },
            {
                docCode: 'handover_record',
                docPath: 'file/daily_progress_4.html',
                docName: '主治医生首次查房记录',
                type: 'file-edit'
            },
            {
                docCode: 'transfusion_record',
                docPath: 'file/daily_progress_5.html',
                docName: '会诊记录',
                type: 'file-edit'
            },
            {
                docCode: 'transfusion_daily_progress_6record',
                docPath: 'file/daily_progress_6.html',
                docName: '接班记录',
                type: 'file-edit'
            },
            {
                docCode: 'daily_progress_7',
                docPath: 'file/daily_progress_7.html',
                docName: '阶段小结',
                type: 'file-edit'
            }
        ]
    },
    {
        id: 'surgery_record',
        docName: '手术记录',
        type: 'folder',
        children: [{
            docCode: 'surgery_record_2222',
            docPath: 'file/surgery_record.html',
            docName: '手术记录',
            type: 'file-edit'
        },
        {
            docCode: 'surgery_record_1',
            docPath: 'file/surgery_record_1.html',
            docName: '术前小结及术前讨论结论记录',
            type: 'file-edit'
        }]
    },
    {
        id: 'discharge_record',
        docName: '出院记录',
        type: 'folder',
        children: [{
            docCode: 'discharge_record',
            docPath: 'file/discharge_record.html',
            docName: '出院记录',
            type: 'file-edit'
        },{
            docCode: 'discharge_record_1',
            docPath: 'file/discharge_record_1.html',
            docName: '死亡记录',
            type: 'file-edit'
        },{
            docCode: 'discharge_record_2',
            docPath: 'file/discharge_record_2.html',
            docName: '死亡病例讨论记录',
            type: 'file-edit'
        }]
    }
];

// 如果是浏览器环境，将数据挂载到window对象上
if (typeof window !== 'undefined') {
    window.documentTreeData = documentTreeData;
}

// 如果是Node.js环境，导出数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = documentTreeData;
}