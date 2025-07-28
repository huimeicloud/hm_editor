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
           recordName: '住院病案首页',
           type: 'file-edit',
           serialNumber:'S2VPWB3391943'
       }]
    },
    {
        id: 'admission_record',
        docName: '入院记录',
        type: 'folder',
        children: [{
                docCode: 'mcvnq6bu4r',
                docPath: 'file/admission_record.html',
                docName: '入院记录',
                recordName: '入院记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'md2j7iys4h',
                docPath: 'file/admission_24h.html',
                docName: '24小时内入出院记录',
                recordName: '24小时内入出院记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'md2j5ff3ra',
                docPath: 'file/admission_24h_death.html',
                docName: '24小时出入院死亡记录',
                recordName: '24小时出入院死亡记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            }
        ]
    },
    {
        id: 'progress_record',
        docName: '病程记录',
        type: 'folder',
        children: [{
                docCode: 'mcvomr3i80',
                docPath: 'file/first_progress.html',
                docName: '首次病程记录',
                recordName: '首次病程记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'mcvon2f6g6',
                docPath: 'file/daily_progress_1.html',
                docName: '日常病程记录',
                recordName: '日常病程记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'mcvoa64b2c',
                docPath: 'file/daily_progress_3.html',
                docName: '主治医生查房记录',
                recordName: '主治医生查房记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'mcvoa64b2c',
                docPath: 'file/daily_progress_4.html',
                docName: '主治医生首次查房记录',
                recordName: '主治医生首次查房记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'mcvoaxouei',
                docPath: 'file/daily_progress_5.html',
                docName: '会诊记录',
                recordName: '会诊记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'mcvtf7iarr',
                docPath: 'file/daily_progress_6.html',
                docName: '接班记录',
                recordName: '接班记录',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            },
            {
                docCode: 'md2j0r9nnp',
                docPath: 'file/daily_progress_7.html',
                docName: '阶段小结',
                recordName: '阶段小结',
                type: 'file-edit',
                serialNumber:'S2VPWB3391943'
            }
        ]
    },
    {
        id: 'surgery_record',
        docName: '手术记录',
        type: 'folder',
        children: [{
            docCode: 'md2j4of7k2',
            docPath: 'file/surgery_record.html',
            docName: '手术记录',
            recordName: '手术记录',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        },
        {
            docCode: 'md2j52nq4h',
            docPath: 'file/surgery_record_1.html',
            docName: '术前小结',
            recordName: '术前小结',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        }]
    },
    {
        id: 'discharge_record',
        docName: '出院记录',
        type: 'folder',
        children: [{
            docCode: 'mcvodv7qdh',
            docPath: 'file/discharge_record.html',
            docName: '出院记录',
            recordName: '出院记录',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        },{
            docCode: 'md2j5ff3ra',
            docPath: 'file/discharge_record_1.html',
            docName: '死亡记录',
            recordName: '死亡记录',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        },{
            docCode: 'md2kk093ne',
            docPath: 'file/discharge_record_2.html',
            docName: '死亡病例讨论记录',
            recordName: '死亡病例讨论记录',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        }]
    }
    ,{
        id: 'nursing_form',
        docName: '护理表单',
        type: 'folder',
        children: [{
            docCode: 'md2j4of7k3',
            docPath: 'file/nursing_form_1.html', 
            docName: '一般护理记录单',
            recordName: '一般护理记录单',
            type: 'file-edit',
            serialNumber:'S2VPWB3391943'
        }]
    }
];

// AI病历文档数据
const aiDocumentTreeData = [
    {
        id: 'patient_S2VT794334788',
        docName: '宁**',
        type: 'folder',
        serialNumber: 'S2VT794334788',
        children: [
            {
                id: 'ai_ryjl_record_S2VT794334788',
                docName: '入院记录',
                type: 'folder',
                children: [{
                    docCode: 'mcy6svuv2',
                    docPath: 'file/ai_ryjl_record_1.html',
                    docName: '入院记录',
                    recordName: '入院记录',
                    type: 'file-edit',
                    recordType: 1,
                    serialNumber: 'S2VT794334788',
                }]
            },
            {
                id: 'ai_bcjl_record_S2VT794334788',
                docName: '病程记录',
                type: 'folder',
                children: [{
                    docCode: 'mcy6xqqrdv',
                    docPath: 'file/ai_scbcjl_record_3.html',
                    docName: '首次病程记录',
                    recordName: '首次病程记录',
                    type: 'file-edit',
                    recordType: 2,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'mcy6zwlqr2',
                    docPath: 'file/ai_cfjl_record_1.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'mcy79zmciz',
                    docPath: 'file/ai_shscbc_record_1.html',
                    docName: '术后首次病程',
                    recordName: '术后首次病程',
                    type: 'file-edit',
                    recordType: 6,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'mcy6ywcwn7',
                    docPath: 'file/ai_sjyscfjl_record_1.html',
                    docName: '上级医师查房记录',
                    recordName: '上级医师查房记录',
                    type: 'file-edit',
                    recordType: 24,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'mcy708vo2h',
                    docPath: 'file/ai_cfjl_record_2.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'mcyip7hx98',
                    docPath: 'file/ai_rcbcjl_record_3.html',
                    docName: '日常病程记录',
                    recordName: '日常病程记录',
                    type: 'file-edit',
                    recordType: 3,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'md45hjk6hw',
                    docPath: 'file/ai_cfjl_record_3.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2VT794334788',
                }]
            },
            {
                id: 'ai_ssjl_record_S2VT794334788',
                docName: '手术记录',
                type: 'folder',
                children: [{
                    docCode: 'mcy75kqq22',
                    docPath: 'file/ai_ssjl_record_1.html',
                    docName: '手术记录',
                    recordName: '手术记录',
                    type: 'file-edit',
                    recordType: 13,
                    serialNumber: 'S2VT794334788',
                },{
                    docCode: 'md715o5d5w',
                    docPath: 'file/ai_sqtl_record_1.html',
                    docName: '术前讨论',
                    recordName: '术前讨论',
                    type: 'file-edit',
                    recordType: 21,
                    serialNumber: 'S2VT794334788',
                }]
            },
            {
                id: 'ai_hlws_record_S2VT794334788',
                docName: '护理文书',
                type: 'folder',
                children: [{
                    docCode: 'md44ug8533',
                    docPath: 'file/ai_rchljl_record_2.html',
                    docName: '日常护理记录',
                    recordName: '日常护理记录',
                    type: 'file-edit',
                    recordType: 2002,
                    serialNumber: 'S2VT794334788',
                }]
            },
            {
                id: 'ai_cyjl_record_S2VT794334788',
                docName: '出院记录',
                type: 'folder',
                children: [{
                    docCode: 'mcy7ep16of',
                    docPath: 'file/ai_cyjl_record_3.html',
                    docName: '出院记录',
                    recordName: '出院记录',
                    type: 'file-edit',
                    recordType: 10,
                    serialNumber: 'S2VT794334788',
                }]
            }
        ]
    },
    // {
    //     id: 'patient_S2VTOMT739144',
    //     docName: '赵**',
    //     type: 'folder',
    //     serialNumber: 'S2VTOMT739144',
    //     children: [
    //         {
    //             id: 'ai_ryjl_record_S2VTOMT739144',
    //             docName: '入院记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'mcyk16e4eh1',
    //                 docPath: 'file/ai_ryjl_record_2.html',
    //                 docName: '入院记录',
    //                 recordName: '入院记录',
    //                 type: 'file-edit',
    //                 recordType: 1,
    //                 serialNumber: 'S2VTOMT739144',
    //             }]
    //         },
    //         {
    //             id: 'ai_bcjl_record_S2VTOMT739144',
    //             docName: '病程记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'mcyk16e4le2',
    //                 docPath: 'file/ai_scbcjl_record_2.html',
    //                 docName: '首次病程记录',
    //                 recordName: '首次病程记录',
    //                 type: 'file-edit',
    //                 recordType: 2,
    //                 serialNumber: 'S2VTOMT739144',
    //             },{
    //                 docCode: 'mcyk16e4783',
    //                 docPath: 'file/ai_rcbcjl_record_1.html',
    //                 docName: '日常病程记录',
    //                 recordName: '日常病程记录',
    //                 type: 'file-edit',
    //                 recordType: 3,
    //                 serialNumber: 'S2VTOMT739144',
    //             }]
    //         },
    //         {
    //             id: 'ai_hlws_record_S2VTOMT739144',
    //             docName: '护理文书',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'mcykokpt16',
    //                 docPath: 'file/ai_rchljl_record_1.html',
    //                 docName: '日常护理记录',
    //                 recordName: '日常护理记录',
    //                 type: 'file-edit',
    //                 recordType: 2002,
    //                 serialNumber: 'S2VTOMT739144',
    //             }]
    //         }
    //     ]
    // },
    // {
    //     id: 'patient_S2VPWB3391943',
    //     docName: '张*三',
    //     type: 'folder',
    //     serialNumber: 'S2VPWB3391943',
    //     children: [
    //         {
    //             id: 'ai_bcjl_record_S2VPWB3391943',
    //             docName: '病程记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'mcvomr3i80',
    //                 docPath: 'file/ai_scbcjl_record_1.html',
    //                 docName: '首次病程记录',
    //                 recordName: '首次病程记录',
    //                 type: 'file-edit',
    //                 recordType: 2,
    //                 serialNumber: 'S2VPWB3391943',
    //             }]
    //         },
    //         {
    //             id: 'ai_cyjl_record_S2VPWB3391943',
    //             docName: '出院记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'ai_cyjl_record_1',
    //                 docPath: 'file/ai_cyjl_record_1.html',
    //                 docName: '出院记录',
    //                 recordName: '出院记录',
    //                 type: 'file-edit',
    //                 recordType: 10,
    //                 serialNumber: 'S2VPWB3391943',
    //             // },
    //             // {
    //             //     docCode: 'ai_cyjl_record_2',
    //             //     docPath: 'file/ai_cyjl_record_2.html',
    //             //     docName: '出院记录',
    //             //     recordName: '出院记录',
    //             //     type: 'file-edit',
    //             //     recordType: 10,
    //             //     serialNumber: 'S2VPWB3391943',
    //             }]
    //         }
    //     ]
    // },
    // {
    //     id: 'patient_S2W0MMZ611031',
    //     docName: '武**',
    //     type: 'folder',
    //     serialNumber: 'S2W0MMZ611031',
    //     children: [
    //         {
    //             id: 'ai_ryjl_record_S2W0MMZ611031',
    //             docName: '入院记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'md3xm5ij5t',
    //                 docPath: 'file/ai_ryjl_record_3.html',
    //                 docName: '入院记录',
    //                 recordName: '入院记录',
    //                 type: 'file-edit',
    //                 recordType: 1,
    //                 serialNumber: 'S2W0MMZ611031',
    //             }]
    //         },
    //         {
    //             id: 'ai_bcjl_record_S2W0MMZ611031',
    //             docName: '病程记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'md3yl5qnfi',
    //                 docPath: 'file/ai_rcbcjl_record_2.html',
    //                 docName: '日常病程记录',
    //                 recordName: '日常病程记录',
    //                 type: 'file-edit',
    //                 recordType: 3,
    //                 serialNumber: 'S2W0MMZ611031',
    //             }]
    //         }
    //     ]
    // },
    // {
    //     id: 'patient_S2W30YS290548',
    //     docName: '斐**',
    //     type: 'folder',
    //     serialNumber: 'S2W30YS290548',
    //     children: [
    //         {
    //             id: 'ai_ryjl_record_S2W30YS290548',
    //             docName: '入院记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'md5rzeb81d',
    //                 docPath: 'file/ai_ryjl_record_4.html',
    //                 docName: '入院记录',
    //                 recordName: '入院记录',
    //                 type: 'file-edit',
    //                 recordType: 1,
    //                 serialNumber: 'S2W30YS290548',
    //             }]
    //         }
    //     ]
    // },
    {
        id: 'patient_S2W6JMO856722',
        docName: '翟**',
        type: 'folder',
        serialNumber: 'S2W6JMO856722',
        children: [
            {
                id: 'ai_ryjl_record_S2W6JMO856722',
                docName: '入院记录',
                type: 'folder',
                children: [{
                    docCode: 'md8h3wvha8',
                    docPath: 'file/ai_ryjl_record_5.html',  
                    docName: '入院记录',
                    recordName: '入院记录',
                    type: 'file-edit',
                    recordType: 1,
                    serialNumber: 'S2W6JMO856722',
                }]
            },
            {
                id: 'ai_bcjl_record_S2W6JMO856722',
                docName: '病程记录',
                type: 'folder',
                children: [{
                    docCode: 'mde6rpouhi',
                    docPath: 'file/ai_cfjl_record_4.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 24,
                    serialNumber: 'S2W6JMO856722',
                }]
            }
        ]
    },
    {
        id: 'patient_S2WDU6T614595',
        docName: '张**',
        type: 'folder',
        serialNumber: 'S2WDU6T614595',
        children: [
            {
                id: 'ai_ryjl_record_S2WDU6T614595',
                docName: '入院记录',
                type: 'folder',
                children: [{
                    docCode: 'mde3pmdtd',
                    docPath: 'file/ai_ryjl_record_7.html',
                    docName: '入院记录',
                    recordName: '入院记录',
                    type: 'file-edit',
                    recordType: 1,
                    serialNumber: 'S2WDU6T614595',
                }]
            }
        ]
    },
    {
        id: 'patient_S2WE36F582881',
        docName: '**宁',
        type: 'folder',
        serialNumber: 'S2WE36F582881',
        children: [
            {
                id: 'ai_ryjl_record_S2WE36F582881',
                docName: '入院记录',
                type: 'folder',
                children: [{
                    docCode: 'mdeamtczoc02',
                    docPath: 'file/ai_ryjl_record_8.html',
                    docName: '入院记录',
                    recordName: '入院记录',
                    type: 'file-edit',
                    recordType: 1,
                    serialNumber: 'S2WE36F582881',
                }]
            },
            {
                id: 'ai_bcjl_record_S2WE36F582881',
                docName: '病程记录',
                type: 'folder',
                children: [{
                    docCode: 'mdeamtczr012',
                    docPath: 'file/ai_scbcjl_record_4.html',
                    docName: '首次病程记录',
                    recordName: '首次病程记录',
                    type: 'file-edit',
                    recordType: 2,
                    serialNumber: 'S2WE36F582881',
                },
                {
                    docCode: 'mdeamtczkg22',
                    docPath: 'file/ai_sjyscfjl_record_2.html',
                    docName: '上级医师查房记录',
                    recordName: '上级医师查房记录',
                    type: 'file-edit',
                    recordType: 24,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtczi132',
                    docPath: 'file/ai_cfjl_record_5.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtczgs42',
                    docPath: 'file/ai_cfjl_record_6.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtczjs62',
                    docPath: 'file/ai_shscbc_record_2.html',
                    docName: '术后首次病程',
                    recordName: '术后首次病程',
                    type: 'file-edit',
                    recordType: 6,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtcz5k82',
                    docPath: 'file/ai_rcbcjl_record_4.html',
                    docName: '日常病程记录',
                    recordName: '日常病程记录',
                    type: 'file-edit',
                    recordType: 3,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtczmu112',
                    docPath: 'file/ai_cfjl_record_7.html',
                    docName: '查房记录',
                    recordName: '查房记录',
                    type: 'file-edit',
                    recordType: 4,
                    serialNumber: 'S2WE36F582881',
                }]
            },
            {
                id: 'ai_ssjl_record_S2WE36F582881',
                docName: '手术记录',
                type: 'folder',
                children: [{
                    docCode: 'mdeamtcz5852',
                    docPath: 'file/ai_ssjl_record_2.html',
                    docName: '手术记录',
                    recordName: '手术记录',
                    type: 'file-edit',
                    recordType: 13,
                    serialNumber: 'S2WE36F582881',
                },{
                    docCode: 'mdeamtczbj132',
                    docPath: 'file/ai_sqtl_record_2.html',
                    docName: '术前讨论',
                    recordName: '术前讨论',
                    type: 'file-edit',
                    recordType: 21,
                    serialNumber: 'S2WE36F582881',
                }]
            },
            {
                id: 'ai_cyjl_record_S2WE36F582881',
                docName: '出院记录',
                type: 'folder',
                children: [{
                    docCode: 'mdeamtcz4g122',
                    docPath: 'file/ai_cyjl_record_4.html',
                    docName: '出院记录',
                    recordName: '出院记录',
                    type: 'file-edit',
                    recordType: 10,
                    serialNumber: 'S2WE36F582881',
                }]
            },
            {
                id: 'ai_hlws_record_S2WE36F582881',
                docName: '护理文书',
                type: 'folder',
                children: [{
                    docCode: 'mdeamtczoh102',
                    docPath: 'file/ai_rchljl_record_3.html',
                    docName: '日常护理记录',
                    recordName: '日常护理记录',
                    type: 'file-edit',
                    recordType: 2002,
                    serialNumber: 'S2WE36F582881',
                }]
            },
        ]
    }
    // {
    //     id: 'patient_S2WBSDM981989',
    //     docName: '翟1***',
    //     type: 'folder',
    //     serialNumber: 'S2WBSDM981989',
    //     children: [
    //         {
    //             id: 'ai_ryjl_record_S2WBSDM981989',
    //             docName: '入院记录',
    //             type: 'folder',
    //             children: [{
    //                 docCode: 'mdciqtijkd02',
    //                 docPath: 'file/ai_ryjl_record_6.html',
    //                 docName: '入院记录',
    //                 recordName: '入院记录',
    //                 type: 'file-edit',
    //                 recordType: 1,
    //                 serialNumber: 'S2WBSDM981989',
    //             }]
    //         }
    //     ]
    // }
];
const aiParams = {
    'mcy6svuv2': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy6svuv2",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-11 10:07:59",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcyk16e4eh1': {
        "userGuid": "P2840KA23338",
        "serialNumber": "S2VTOMT739144",
        "caseNo": "M-2VTOMT04761",
        "patientName": "赵**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 16:23:17",
        "inpatientDepartment": "呼吸科",
        "inpatientArea": "",
        "inpatientDepartmentId": "呼吸科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1940-07-11",
            "age": 85,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2840KA23338",
                "progressGuid": "mcyk16e4eh1",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-11 16:28:15",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'ai_cyjl_record_2': {
        "userGuid": "P2813DG68623",
        "serialNumber": "S2VPWB3391943",
        "caseNo": "M-2VPWB302031",
        "patientName": "张*三",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-09 16:06:59",
        "inpatientDepartment": "心脏科",
        "inpatientArea": "",
        "inpatientDepartmentId": "心脏科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 0,
            "birthDate": "1980-07-09",
            "age": 45,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2813DG68623",
                "progressGuid": "ai_cyjl_record_1",
                "progressType": 10,
                "progressTypeName": "出院记录",
                "progressTitleName": "出院记录",
                "recordTime": "2025-07-09 15:59:08",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'ai_cyjl_record_1': {
        "userGuid": "P2813DG68623",
        "serialNumber": "S2VPWB3391943",
        "caseNo": "M-2VPWB302031",
        "patientName": "张*三",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-09 16:06:59",
        "inpatientDepartment": "心脏科",
        "inpatientArea": "",
        "inpatientDepartmentId": "心脏科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 0,
            "birthDate": "1980-07-09",
            "age": 45,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2813DG68623",
                "progressGuid": "ai_cyjl_record_1",
                "progressType": 10,
                "progressTypeName": "出院记录",
                "progressTitleName": "出院记录",
                "recordTime": "2025-07-09 15:59:08",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcvomr3i80': {
        "userGuid": "P2813DG68623",
        "serialNumber": "S2VPWB3391943",
        "caseNo": "M-2VPWB302031",
        "patientName": "张*三",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-09 16:06:59",
        "inpatientDepartment": "心脏科",
        "inpatientArea": "",
        "inpatientDepartmentId": "心脏科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 0,
            "birthDate": "1980-07-09",
            "age": 45,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2813DG68623",
                "progressGuid": "mcvomr3i80",
                "progressType": 3,
                "progressTypeName": "首次病程记录",
                "progressTitleName": "首次病程记录",
                "recordTime": "2025-07-09 15:59:08",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcyk16e4le2': {
        "userGuid": "P2840KA23338",
        "serialNumber": "S2VTOMT739144",
        "caseNo": "M-2VTOMT04761",
        "patientName": "赵**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 16:23:17",
        "inpatientDepartment": "呼吸科",
        "inpatientArea": "",
        "inpatientDepartmentId": "呼吸科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1940-07-11",
            "age": 85,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2840KA23338",
                "progressGuid": "mcyk16e4le2",
                "progressType": 2,
                "progressTypeName": "首次病程记录",
                "progressTitleName": "首次病程记录",
                "recordTime": "2025-07-11 16:28:15",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcyk16e4783': {
        "userGuid": "P2840KA23338",
        "serialNumber": "S2VTOMT739144",
        "caseNo": "M-2VTOMT04761",
        "patientName": "赵**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 16:23:17",
        "inpatientDepartment": "呼吸科",
        "inpatientArea": "",
        "inpatientDepartmentId": "呼吸科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1940-07-11",
            "age": 85,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2840KA23338",
                "progressGuid": "mcyk16e4783",
                "progressType": 3,
                "progressTypeName": "日常病程",
                "progressTitleName": "日常病程",
                "recordTime": "2025-07-11 16:28:15",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy6zwlqr2': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy6zwlqr2",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-11 10:13:26",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy708vo2h': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy708vo2h",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-11 10:13:42",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy6xqqrdv': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy6xqqrdv",
                "progressType": 2,
                "progressTypeName": "首次病程记录",
                "progressTitleName": "首次病程记录",
                "recordTime": "2025-07-11 10:11:46",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy79zmciz': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy79zmciz",
                "progressType": 6,
                "progressTypeName": "术后首次病程",
                "progressTitleName": "术后首次病程",
                "recordTime": "2025-07-11 10:21:16",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy6ywcwn7': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy6ywcwn7",
                "progressType": 24,
                "progressTypeName": "上级医师查房记录",
                "progressTitleName": "上级医师查房记录",
                "recordTime": "2025-07-11 10:12:39",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy7ep16of': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy7ep16of",
                "progressType": 10,
                "progressTypeName": "出院记录",
                "progressTitleName": "出院记录",
                "recordTime": "2025-07-11 10:24:56",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcy75kqq22': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 10:07:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcy75kqq22",
                "progressType": 13,
                "progressTypeName": "手术记录",
                "progressTitleName": "手术记录",
                "recordTime": "2025-07-11 10:17:51",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md715o5d5w': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "md715o5d5w",
                "progressType": 21,
                "progressTypeName": "术前讨论",
                "progressTitleName": "术前讨论",
                "recordTime": "2025-07-06 14:31:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcykokpt16': {
        "userGuid": "P2840KA23338",
        "serialNumber": "S2VTOMT739144",
        "caseNo": "M-2VTOMT04761",
        "patientName": "赵**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-11 16:23:17",
        "inpatientDepartment": "呼吸科",
        "inpatientArea": "",
        "inpatientDepartmentId": "呼吸科",
        "divisionId": null,
        "pageSource": 6,
        "openInterdict": 0,
        "triggerSource": 2,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1940-07-11",
            "age": 85,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P2840KA23338",
                "progressGuid": "mcykokpt16",
                "progressType": 2002,
                "progressTypeName": "日常护理记录",
                "progressTitleName": "日常护理记录",
                "recordTime": "2025-07-11 16:36:13",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md3xm5ij5t': {
        "userGuid": "P289DGUL7014",
        "serialNumber": "S2W0MMZ611031",
        "caseNo": "M-2W0MMZ09997",
        "patientName": "武**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-15 10:38:24",
        "inpatientDepartment": "心脏科",
        "inpatientArea": "",
        "inpatientDepartmentId": "心脏科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1957-07-08",
            "age": 68,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P289DGUL7014",
                "progressGuid": "md3xm5ij5t",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-08 10:31:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md3yl5qnfi': {
        "userGuid": "P289DGUL7014",
        "serialNumber": "S2W0MMZ611031",
        "caseNo": "M-2W0MMZ09997",
        "patientName": "武**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-15 10:38:24",
        "inpatientDepartment": "心脏科",
        "inpatientArea": "",
        "inpatientDepartmentId": "心脏科",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1957-07-08",
            "age": 68,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P289DGUL7014",
                "progressGuid": "md3yl5qnfi",
                "progressType": 3,
                "progressTypeName": "日常病程",
                "progressTitleName": "日常病程",
                "recordTime": "2025-07-14 09:59:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mcyip7hx98': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-15 14:42:58",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "mcyip7hx98",
                "progressType": 3,
                "progressTypeName": "日常病程",
                "progressTitleName": "日常病程",
                "recordTime": "2025-07-11 15:40:46",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md45hjk6hw': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-15 14:42:58",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1992-07-11",
            "age": 33,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "md45hjk6hw",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-15 14:12:28",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md44ug8533': {
        "userGuid": "P283N5HCE698",
        "serialNumber": "S2VT794334788",
        "caseNo": "M-2VT79401361",
        "patientName": "宁**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 6,
        "openInterdict": 0,
        "triggerSource": 2,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P283N5HCE698",
                "progressGuid": "md44ug8533",
                "progressType": 2002,
                "progressTypeName": "日常护理记录",
                "progressTitleName": "日常护理记录",
                "recordTime": "2025-07-15 13:54:31",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md5rzeb81d': {
        "userGuid": "P28B82U9U809",
        "serialNumber": "S2W30YS290548",
        "caseNo": "M-2W30YS09194",
        "patientName": "斐**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 17:48:52",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1970-07-16",
            "age": 55,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28B82U9U809",
                "progressGuid": "md5rzeb81d",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-16 17:28:32",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'md8h3wvha8': {
        "userGuid": "P28DXTAAG801",
        "serialNumber": "S2W6JMO856722",
        "caseNo": "M-2W6JMO06899",
        "patientName": "翟***",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-06-18 00:00:00",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1960-07-18",
            "age": 65,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28DXTAAG801",
                "progressGuid": "md8h3wvha8",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-18 15:04:06",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdciqtijkd02': {
        "userGuid": "P28HZGAUD008",
        "serialNumber": "S2WBSDM981989",
        "caseNo": "M-2WBSDM03183",
        "patientName": "翟1***",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-18 11:02:11",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1960-07-18",
            "age": 65,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28HZGAUD008",
                "progressGuid": "mdciqtijkd02",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-18 15:04:06",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mde3pmdtd': {
        "userGuid": "P28JKELIM207",
        "serialNumber": "S2WDU6T614595",
        "caseNo": "M-2WDU6T01457",
        "patientName": "张**",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-22 13:35:37",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 0,
            "birthDate": "1980-07-22",
            "age": 45,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JKELIM207",
                "progressGuid": "mde3pmdtd",
                "progressType": 1,
                "progressTypeName": "入院记录",
                "progressTitleName": "入院记录",
                "recordTime": "2025-07-22 13:35:43",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mde6rpouhi': {
        "userGuid": "P28DXTAAG801",
        "serialNumber": "S2W6JMO856722",
        "caseNo": "M-2W6JMO06899",
        "patientName": "翟***",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-06-18 00:00:00",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1960-07-18",
            "age": 65,
            "ageType": "岁",
            "maritalStatus": 2,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28DXTAAG801",
                "progressGuid": "mde6rpouhi",
                "progressType": 24,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-22 15:00:59",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczoc02': {
         "userGuid": "P28JRCAOU532",
         "serialNumber": "S2WE36F582881",
         "caseNo": "M-2WE36F00761",
         "patientName": "**宁",
         "doctorGuid": "hmpm",
         "doctorName": "pm",
         "admissionTime": "2025-07-17 13:23:50",
         "inpatientDepartment": "市级家庭病房",
         "inpatientArea": "",
         "inpatientDepartmentId": "市级家庭病房",
         "divisionId": null,
         "pageSource": 2,
         "openInterdict": 0,
         "triggerSource": 1,
         "patientInfo": {
             "gender": 1,
             "birthDate": "1955-07-17",
             "age": 70,
             "ageType": "岁",
             "maritalStatus": 1,
             "pregnancyStatus": null
         },
         "refreshGptResult": false,
         "deleteProgressNoteList": null,
         "progressNoteList": [
             {
                 "patientGuid": "P28JRCAOU532",
                 "progressGuid": "mdeamtczoc02",
                 "progressType": 1,
                 "progressTypeName": "入院记录",
                 "progressTitleName": "入院记录",
                 "recordTime": "2025-07-02 10:07:00",
                 "doctorGuid": "hmpm",
                 "doctorName": "pm",
                 "msgType": 0,
                 "progressMessage": ""
             }
         ]
     },
     'mdeamtczr012': {
         "userGuid": "P28JRCAOU532",
         "serialNumber": "S2WE36F582881",
         "caseNo": "M-2WE36F00761",
         "patientName": "**宁",
         "doctorGuid": "hmpm",
         "doctorName": "pm",
         "admissionTime": "2025-07-17 13:23:50",
         "inpatientDepartment": "市级家庭病房",
         "inpatientArea": "",
         "inpatientDepartmentId": "市级家庭病房",
         "divisionId": null,
         "pageSource": 2,
         "openInterdict": 0,
         "triggerSource": 1,
         "patientInfo": {
             "gender": 1,
             "birthDate": "1955-07-17",
             "age": 70,
             "ageType": "岁",
             "maritalStatus": 1,
             "pregnancyStatus": null
         },
         "refreshGptResult": false,
         "deleteProgressNoteList": null,
         "progressNoteList": [
             {
                 "patientGuid": "P28JRCAOU532",
                 "progressGuid": "mdeamtczr012",
                 "progressType": 2,
                 "progressTypeName": "首次病程记录",
                 "progressTitleName": "首次病程记录",
                 "recordTime": "2025-07-02 10:11:00",
                 "doctorGuid": "hmpm",
                 "doctorName": "pm",
                 "msgType": 0,
                 "progressMessage": ""
             }
         ]
     },
     'mdeamtczkg22': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczkg22",
                "progressType": 24,
                "progressTypeName": "上级医师查房记录",
                "progressTitleName": "上级医师查房记录",
                "recordTime": "2025-07-03 10:12:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczi132': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczi132",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-04 10:13:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczgs42': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczgs42",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-06 10:13:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczjs62': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczjs62",
                "progressType": 6,
                "progressTypeName": "术后首次病程",
                "progressTitleName": "术后首次病程",
                "recordTime": "2025-07-08 10:21:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtcz5k82': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtcz5k82",
                "progressType": 3,
                "progressTypeName": "日常病程",
                "progressTitleName": "日常病程",
                "recordTime": "2025-07-10 15:40:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczmu112': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczmu112",
                "progressType": 4,
                "progressTypeName": "查房记录",
                "progressTitleName": "查房记录",
                "recordTime": "2025-07-12 14:12:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtcz5852': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtcz5852",
                "progressType": 13,
                "progressTypeName": "手术记录",
                "progressTitleName": "手术记录",
                "recordTime": "2025-07-07 14:17:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczbj132': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczbj132",
                "progressType": 21,
                "progressTypeName": "术前讨论",
                "progressTitleName": "术前讨论",
                "recordTime": "2025-07-06 14:31:00",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtcz4g122': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 2,
        "openInterdict": 0,
        "triggerSource": 1,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtcz4g122",
                "progressType": 10,
                "progressTypeName": "出院记录",
                "progressTitleName": "出院记录",
                "recordTime": "2025-07-15 14:40:40",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    },
    'mdeamtczoh102': {
        "userGuid": "P28JRCAOU532",
        "serialNumber": "S2WE36F582881",
        "caseNo": "M-2WE36F00761",
        "patientName": "**宁",
        "doctorGuid": "hmpm",
        "doctorName": "pm",
        "admissionTime": "2025-07-17 13:23:50",
        "inpatientDepartment": "市级家庭病房",
        "inpatientArea": "",
        "inpatientDepartmentId": "市级家庭病房",
        "divisionId": null,
        "pageSource": 6,
        "openInterdict": 0,
        "triggerSource": 2,
        "patientInfo": {
            "gender": 1,
            "birthDate": "1955-07-17",
            "age": 70,
            "ageType": "岁",
            "maritalStatus": 1,
            "pregnancyStatus": null
        },
        "refreshGptResult": false,
        "deleteProgressNoteList": null,
        "progressNoteList": [
            {
                "patientGuid": "P28JRCAOU532",
                "progressGuid": "mdeamtczoh102",
                "progressType": 2002,
                "progressTypeName": "日常护理记录",
                "progressTitleName": "日常护理记录",
                "recordTime": "2025-07-15 13:54:31",
                "doctorGuid": "hmpm",
                "doctorName": "pm",
                "msgType": 0,
                "progressMessage": ""
            }
        ]
    }
}

// 如果是浏览器环境，将数据挂载到window对象上
if (typeof window !== 'undefined') {
    window.documentTreeData = documentTreeData;
    window.aiDocumentTreeData = aiDocumentTreeData;
    window.aiParams = aiParams;
}

// 如果是Node.js环境，导出数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        documentTreeData: documentTreeData,
        aiDocumentTreeData: aiDocumentTreeData
    };
}