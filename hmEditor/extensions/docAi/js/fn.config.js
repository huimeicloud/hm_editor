window.CdssHost=window.location.protocol+'//172.16.3.51/cdss/';
commonHM.component['hmAi'].fn({
    RecordType:{
        "67be8d7acf7eab1611ef9783":{name:'24小时内入出院记录',cdssRecordType:23},
        "67be8d76cf7eab1611ef9780":{name:'入院记录',cdssRecordType:1},
        "67be8db5cf7eab1611ef979d":{name:'日常病程记录',cdssRecordType:3},
        "67be8d97cf7eab1611ef9797":{name:'主治医生查房记录',cdssRecordType:4},
        "67be8d94cf7eab1611ef9794":{name:'上级医生查房记录',cdssRecordType:24},
        "67be8d90cf7eab1611ef9791":{name:'术后首次病程记录',cdssRecordType:6},
        "67be8d8dcf7eab1611ef978e":{name:'首次查房记录',cdssRecordType:12},
        "67be8d8acf7eab1611ef978b":{name:'副主任或主任医师首次查房记录',cdssRecordType:12},
        "67be8d7dcf7eab1611ef9786":{name:'首次病程记录',cdssRecordType:2},
        "67be86b8cf7eab1611ef9719":{name:'出院记录',cdssRecordType:10},
        "67d02126ed43137d15b5da44":{name:'出院记录',cdssRecordType:10},
        "67f8799ded43137d15b6234d":{name:'手术记录',cdssRecordType:13}
    },

    Url:{
        // qcResult:CdssHost+'api/cdss/qcResult',//质控结果   
        qcResult:CdssHost+'api/outer/wagon/emr/problems',//质控结果   
        ignoreWarn:CdssHost+'api/outer/mc/reminder/completed'//忽略警告
    }
})