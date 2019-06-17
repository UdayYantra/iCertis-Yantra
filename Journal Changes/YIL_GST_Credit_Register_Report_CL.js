/**
 * 
 * @NApiVersion 2.x
 * @NScriptType ClientScript 
 * 
 */
define([], function() {

    function fieldChanged(scriptContext) {

        var currentRecObj = scriptContext.currentRecord;
        
        var currentPeriodId = currentRecObj.getValue({fieldId: 'custpage_periods'});
        var subsidiaryId    = currentRecObj.getValue({fieldId: 'custpage_subsidiary'});
        var vendorId        = currentRecObj.getValue({fieldId: 'custpage_vendor'});

        var basePath = window.location.href;
        basePath = basePath.substring(0, basePath.indexOf("&deploy=1")+9);
        
        if(currentPeriodId) { basePath += "&pid=" + currentPeriodId; }
        if(subsidiaryId) { basePath += "&sid=" + subsidiaryId; }
        if(vendorId) { basePath += "&vid=" + vendorId; }

        window.onbeforeunload = false;
        window.location.href = basePath;

    }

    function _resetFormBtn() {
        var basePath = window.location.href;
        basePath = basePath.substring(0, basePath.indexOf("&deploy=1")+9);
        window.onbeforeunload = false;
        window.location.href = basePath;
    }

    function _redirectExportBtn(expoParam) {
        //alert("Hi There !");
        //console.log(expoParam.vid);

        var basePath = window.location.href;
        basePath = basePath.substring(0, basePath.indexOf("&deploy=1")+9);
        basePath += "&iexp=T";
        if(expoParam.prd) { basePath += "&pid=" + expoParam.prd; }
        if(expoParam.sub) { basePath += "&sid=" + expoParam.sub; }
        if(expoParam.vid) { basePath += "&vid=" + expoParam.vid; }

        window.onbeforeunload = false;
        window.location.href = basePath;

    }
    function _redirectSoExportBtn(expoParam) {
        var basePath = window.location.href;
        basePath = basePath.substring(0, basePath.indexOf("&deploy=1")+9);
        basePath += "&iexp=S";
        if(expoParam.prd) { basePath += "&pid=" + expoParam.prd; }
        if(expoParam.sub) { basePath += "&sid=" + expoParam.sub; }
        if(expoParam.cid) { basePath += "&cid=" + expoParam.cid; }

        window.onbeforeunload = false;
        window.location.href = basePath;
    }

    function _redirectJeExportBtn(expoParam) {
        var basePath = window.location.href;
        basePath = basePath.substring(0, basePath.indexOf("&deploy=1")+9);
        basePath += "&iexp=J";
        if(expoParam.prd) { basePath += "&pid=" + expoParam.prd; }
        if(expoParam.sub) { basePath += "&sid=" + expoParam.sub; }
        if(expoParam.cid) { basePath += "&cid=" + expoParam.cid; }
        if(expoParam.vid) { basePath += "&vid=" + expoParam.vid; }

        window.onbeforeunload = false;
        window.location.href = basePath;
    }

    return {
        fieldChanged: fieldChanged,
        _resetFormBtn: _resetFormBtn,
        _redirectExportBtn: _redirectExportBtn,
        _redirectSoExportBtn: _redirectSoExportBtn,
        _redirectJeExportBtn: _redirectJeExportBtn
    }

});