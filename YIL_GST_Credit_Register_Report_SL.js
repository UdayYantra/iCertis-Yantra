/**
 * 
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 */

 define(["N/https", "N/ui/serverWidget", "N/search", "N/file", "N/encode"], function(https, ui, search, file, encode) {


    function onRequest(context) {

        var currentPeriodId = '';
        var subsidiaryId    = '';
        var vendorId        = '';
        var customerId      = '';
        var isExport        = '';
        var fileContext     = '';
        var expoParams      = {prd: "",sub: "", vid: "", cid: ""};
        var journalId       = '';
        

        if(context.request.method == https.Method.GET) {

            currentPeriodId = context.request.parameters['pid'];
            subsidiaryId    = context.request.parameters['sid'];
            vendorId        = context.request.parameters['vid'];
            customerId      = context.request.parameters['cid'];
            isExport        = context.request.parameters['iexp']; 
            
            if(isExport != "T" && isExport != "S") {
                
                if(currentPeriodId) { expoParams.prd = currentPeriodId; }
                if(subsidiaryId) { expoParams.sub = subsidiaryId; }
                if(vendorId) { expoParams.vid = vendorId; }
                if(customerId) { expoParams.cid = customerId; }

                var form = ui.createForm({title: 'GST Credit Register Report'});
                form.clientScriptModulePath = "SuiteScripts/YIL_GST_Credit_Register_Report_CL.js";
                var primaryFieldGroup = form.addFieldGroup({id: 'primaryfieldgroup', label: 'Priamary Filters'});
                    var subsidiaryFilterFld = form.addField({id: 'custpage_subsidiary', label: 'Subsidiary', type: 'select', source: 'subsidiary', container: 'primaryfieldgroup'});
                    var vendorFilterFld = form.addField({id: 'custpage_vendor', label: 'Vendor', type: 'select', source: 'vendor', container: 'primaryfieldgroup'});
                    var periodFilterFld = form.addField({id: 'custpage_periods', label: 'Period', type: 'select', container: 'primaryfieldgroup'});
                    var customerFilterFld = form.addField({id: 'custpage_customer', label: 'Customer', type: 'select', source: 'customer', container: 'primaryfieldgroup'});
                    currentPeriodId = _addAccoutingPeriods(periodFilterFld, currentPeriodId);
                var poSubListObj = form.addSublist({id: 'custpage_po_report_sublist', label: 'Purchase Report', type: ui.SublistType.LIST});
                var soSubListObj = form.addSublist({id: 'custpage_so_report_sublist', label: 'Sales Report', type: ui.SublistType.LIST});
                var jeSublistObj = form.addSublist({id: 'custpage_je_report_sublist', label: 'Journal Report', type: ui.SublistType.LIST});
                    _addSublistFields(poSubListObj, soSubListObj, jeSublistObj);
                form.addButton({id: 'custpage_export_po_excel', label: 'Export PO Report', functionName: "_redirectExportBtn("+JSON.stringify(expoParams)+")"});
                form.addButton({id: 'custpage_export_so_excel', label: 'Export SO Report', functionName: "_redirectSoExportBtn("+JSON.stringify(expoParams)+")"});
                form.addButton({id: 'custpage_reset', label: 'Reset', functionName: "_resetFormBtn()"});
                
                if(subsidiaryId) { subsidiaryFilterFld.defaultValue = subsidiaryId; }
                if(vendorId) { vendorFilterFld.defaultValue = vendorId; }
                if(customerId) { customerFilterFld.defaultValue = customerId; }
            
            }
            else if(isExport == "T") {
                currentPeriodId = _addAccoutingPeriods('', currentPeriodId);
                //Reference can be found here >>
                //https://www.cnblogs.com/backuper/p/export_netsuite_data_to_excel_file.html
                fileContext = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                fileContext += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                fileContext += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                fileContext += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                fileContext += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                fileContext += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                fileContext += '<Styles>'
                + '<Style ss:ID="s63">'
                + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>'
                + '</Style>' + '</Styles>';

                fileContext += '<Worksheet ss:Name="Sheet1">';
                fileContext += '<Table>';
                fileContext += _getPoExcelHeaders();
                
            }
            else if(isExport == "S") {
                currentPeriodId = _addAccoutingPeriods('', currentPeriodId);
                //Reference can be found here >>
                //https://www.cnblogs.com/backuper/p/export_netsuite_data_to_excel_file.html
                fileContext = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                fileContext += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                fileContext += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                fileContext += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                fileContext += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                fileContext += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

                fileContext += '<Styles>'
                + '<Style ss:ID="s63">'
                + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>'
                + '</Style>' + '</Styles>';

                fileContext += '<Worksheet ss:Name="Sheet1">';
                fileContext += '<Table>';
                fileContext += _getSoExcelHeaders();
            }
            
            var poFileBodyContents = _generateOrExportPurchaseReport(poSubListObj, currentPeriodId, subsidiaryId, vendorId, isExport, expoParams);
            
            var soFileBodyContents = _generateORExportSalesReport(soSubListObj, currentPeriodId, subsidiaryId, customerId, isExport, expoParams);

            if(isExport != "T" && isExport != "S" ) {
                context.response.writePage(form);
                return true;
            }
            else if(isExport == "T") {
                if(poFileBodyContents) {
                    fileContext += poFileBodyContents;
                }
                fileContext += '</Table></Worksheet></Workbook>';

                var strXmlEncoded = encode.convert({
                    string : fileContext,
                    inputEncoding : encode.Encoding.UTF_8,
                    outputEncoding : encode.Encoding.BASE_64
                });
                
                var fileObj = file.create({name : 'GST Register Report Purchase.xls', fileType : file.Type.EXCEL, contents : strXmlEncoded});
                
                context.response.writeFile({file : fileObj});

            }
            else if(isExport == "S") {
                if(soFileBodyContents) {
                    fileContext += soFileBodyContents;
                }
                fileContext += '</Table></Worksheet></Workbook>';

                var strXmlEncoded = encode.convert({
                    string : fileContext,
                    inputEncoding : encode.Encoding.UTF_8,
                    outputEncoding : encode.Encoding.BASE_64
                });
                
                var fileObj = file.create({name : 'GST Register Report Sales.xls', fileType : file.Type.EXCEL, contents : strXmlEncoded});
                
                context.response.writeFile({file : fileObj});
            }

        }

    }

    function _addSublistFields(poSubListObj, soSubListObj, jeSublistObj) {

        poSubListObj.addField({id: 'custpage_srno', label: 'Sr. No.', type: ui.FieldType.INTEGER});
        poSubListObj.addField({id: 'custpage_bill_no', label: 'Invoice No./ Credit Note No.', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_bill_dt', label: 'Invoice Date', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_act_bill_dt', label: 'Actual Invoice Date', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_vendor', label: 'Name of the Service Provider', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_vendor_cat', label: 'Nature of Input Service', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_vendor_addr', label: 'Address of Service Provider', type: ui.FieldType.TEXTAREA});
        poSubListObj.addField({id: 'custpage_vendor_gst_no', label: 'GST Number of Service Provider', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_glaccount', label: 'GL ACCOUNT', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_gross_amt', label: 'Total Bill Amount (Gross)', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_tax_amt', label: 'Taxable value', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_hsn_code', label: 'VENDOR HSN/SAC CODE', type: ui.FieldType.TEXT});
        poSubListObj.addField({id: 'custpage_cgst_tpf', label: 'CGST-2.5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_tpf', label: 'SGST-2.5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_six', label: 'CGST-6%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_six', label: 'SGST-6%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_nine', label: 'CGST-9%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_nine', label: 'SGST-9%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_forteen', label: 'CGST-14%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_forteen', label: 'SGST-14%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_five', label: 'IGST-5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_twelve', label: 'IGST-12%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_eighteen', label: 'IGST-18%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_twentyeight', label: 'IGST-28%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_airline_cgst_tpf', label: 'Airline CGST-2.5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_airline_sgst_tpf', label: 'Airline SGST-2.5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_airline_igst_five', label: 'Airline IGST-5%', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_rcm_five', label: 'IGST-5% RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_rcm_twelve', label: 'IGST-12% RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_rcm_eighteen', label: 'IGST-18% RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_igst_rcm_twentyeight', label: 'IGST-28% RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_rcm_tpf', label: 'CGST-2.5%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_rcm_tpf', label: 'SGST-2.5%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_rcm_six', label: 'CGST-6%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_rcm_six', label: 'SGST-6%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_rcm_nine', label: 'CGST-9%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_rcm_nine', label: 'SGST-9%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_cgst_rcm_forteen', label: 'CGST-14%- RCM Payable', type: ui.FieldType.CURRENCY});
        poSubListObj.addField({id: 'custpage_sgst_rcm_forteen', label: 'SGST-14%- RCM Payable', type: ui.FieldType.CURRENCY});


        soSubListObj.addField({id: 'custpage_so_srno', label: 'Sr. No.', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_inv_no', label: 'Invoice No.', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_inv_dt', label: 'Date', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_cust_nm', label: 'Name of Customer', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_cust_addr', label: 'Address of Customer', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_gst_no', label: 'GST Number of Customer', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_gl_acc', label: 'GL Account', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_total_amt', label: 'Total Bill Amount (Gross)', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_tax_amt', label: 'Taxable Value', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_hsn_code', label: 'HSN/SCA Code', type: ui.FieldType.TEXT});
        soSubListObj.addField({id: 'custpage_so_tax_rate', label: 'Tax Rate', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_cgst_tpf', label: 'CGST-2.5%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_sgst_tpf', label: 'SGST-2.5%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_cgst_six', label: 'CGST-6%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_sgst_six', label: 'SGST-6%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_cgst_nine', label: 'CGST-9%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_sgst_nine', label: 'sgst-9%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_cgst_forteen', label: 'CGST-14%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_sgst_forteen', label: 'SGST-14%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_igst_five', label: 'IGST-5%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_igst_twelve', label: 'IGST-12%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_igst_eighteen', label: 'IGST-18%', type: ui.FieldType.CURRENCY});
        soSubListObj.addField({id: 'custpage_so_igst_twenty_eight', label: 'IGST-28%', type: ui.FieldType.CURRENCY});

        
        jeSubListObj.addField({id: 'custpage_je_srno', label: 'Sr. No.', type: ui.FieldType.TEXT});
        jeSubListObj.addField({id: 'custpage_je_inv_no', label: 'Invoice No.', type: ui.FieldType.TEXT});
        jeSubListObj.addField({id: 'custpage_je_inv_dt', label: 'Date', type: ui.FieldType.TEXT});

    }

    function _generateOrExportPurchaseReport(poSubListObj, currentPeriodId, subsidiaryId, vendorId, isExport, expoParams) {

        var billSearch = search.load({id: 'customsearch892'});
        var tempFileContent = '';
        var totalRange = billSearch.runPaged().count;
        var srNoCount   = 1;
        var lineNo      = 0;
        //log.debug({title: "Search Length", details: totalRange});
        if(totalRange > 0) {
            var billSearchFilter = billSearch.filterExpression;
            if(currentPeriodId) {
                billSearchFilter.push("AND");
                billSearchFilter.push(['postingperiod', 'abs', currentPeriodId]);
                //billSearchFilter.push(search.createFilter({name: 'postingperiod', operator: 'abs', values: [currentPeriodId]}));
            }
            if(subsidiaryId) {
                billSearchFilter.push("AND");
                billSearchFilter.push(['subsidiary', 'anyof', subsidiaryId]);
            }
            if(vendorId) {
                billSearchFilter.push("AND");
                billSearchFilter.push(['mainname', 'anyof', vendorId]);
            }
            //log.debug({title: 'billSearchFilter', details: billSearchFilter});
            billSearch.filterExpression = billSearchFilter;

            var searchRange = billSearch.run();
            var ed = 0;
            
            var totalRange1 = billSearch.runPaged().count;

            for(var st=ed;st<totalRange1;st++) {
                ed = st+999;
                if(totalRange1 < ed) {
                    ed = Number(totalRange1);
                }
                //log.debug({title: "St & Ed", details: st +" & "+ ed});
                var billSearchResultSet = '';
                billSearchResultSet = searchRange.getRange({start: Number(st), end: Number(ed)});
                
                //log.debug({title: 'billSearchResultSet Length', details: billSearchResultSet.length});

                for(var i=0;i<billSearchResultSet.length;i++) {
                    var srNo = Number(srNoCount).toFixed(0);   srNoCount++;
                    var billId = '', billDate = '', billActualDate = '', vendor = '', vendorCategory = '', vendorAddress = '', 
                        vendorGstNumber = '', taxItemId = '', gstTaxRate = '', billGrossAmt = '', taxableAmount = '', glAccountNm = '',
                        glAccountId = '', igstRate = '', igstAmount = '', cgstRate = '', cgstAmount = '', sgstRate = '', vendorHsnCode = '',
                        cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '',
                        cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '',
                        isReversalLine = '', isReversalProcs = '';

                    var airlineCGSTTpF = '', airlineSGSTTpF = '', airlineIGSTFive = '', igstRcmFive = '', igstRcmTwelve = '', igstRcmEighteen = '', igstRcmTwentyEight = '',
                        cgstRcmTpf = '', sgstRcmTpf = '', cgstRcmSix = '', sgstRcmSix = '', cgstRcmNine = '', sgstRcmNine = '', 
                        cgstRcmFourteen = '', sgstRcmFourteen = '', cgstNinePayable = '', sgstNinePayable = '';

                    billId          = billSearchResultSet[i].getValue(searchRange.columns[0]);
                    billDate        = billSearchResultSet[i].getValue(searchRange.columns[1]);
                    billActualDate  = billSearchResultSet[i].getValue(searchRange.columns[2]);
                    vendor          = billSearchResultSet[i].getValue(searchRange.columns[3]);
                    vendorCategory  = billSearchResultSet[i].getText(searchRange.columns[4]);
                    vendorAddress   = billSearchResultSet[i].getValue(searchRange.columns[5]);
                    vendorGstNumber = billSearchResultSet[i].getValue(searchRange.columns[6]);
                    taxItemId       = billSearchResultSet[i].getValue(searchRange.columns[8]);
                    gstTaxRate      = billSearchResultSet[i].getValue(searchRange.columns[9]);
                    billGrossAmt    = billSearchResultSet[i].getValue(searchRange.columns[10]);
                    taxableAmount   = billSearchResultSet[i].getValue(searchRange.columns[11]);
                    glAccountNm     = billSearchResultSet[i].getText(searchRange.columns[12]);
                    glAccountId     = billSearchResultSet[i].getValue(searchRange.columns[12]);
                    igstRate        = billSearchResultSet[i].getValue(searchRange.columns[13]);
                    igstAmount      = billSearchResultSet[i].getValue(searchRange.columns[14]);
                    cgstRate        = billSearchResultSet[i].getValue(searchRange.columns[15]);
                    cgstAmount      = billSearchResultSet[i].getValue(searchRange.columns[16]);
                    sgstRate        = billSearchResultSet[i].getValue(searchRange.columns[17]);
                    vendorHsnCode   = billSearchResultSet[i].getValue(searchRange.columns[19]);
                    
                    cgstTPF         = billSearchResultSet[i].getValue(searchRange.columns[20]);
                    sgstTPF         = billSearchResultSet[i].getValue(searchRange.columns[21]);
                    cgstSix         = billSearchResultSet[i].getValue(searchRange.columns[22]);
                    sgstSix         = billSearchResultSet[i].getValue(searchRange.columns[23]);
                    cgstNine        = billSearchResultSet[i].getValue(searchRange.columns[24]);
                    sgstNine        = billSearchResultSet[i].getValue(searchRange.columns[25]);
                    cgstFourteen    = billSearchResultSet[i].getValue(searchRange.columns[26]);
                    sgstFourteen    = billSearchResultSet[i].getValue(searchRange.columns[27]);

                    igstFive        = billSearchResultSet[i].getValue(searchRange.columns[28]);
                    igstTwelve      = billSearchResultSet[i].getValue(searchRange.columns[29]);
                    igstEighteen    = billSearchResultSet[i].getValue(searchRange.columns[30]);
                    igstTwentyEight = billSearchResultSet[i].getValue(searchRange.columns[31]);
                    isReversalLine  = billSearchResultSet[i].getValue(searchRange.columns[32]);
                    isReversalProcs = billSearchResultSet[i].getValue(searchRange.columns[33]);

                    //log.debug({title: 'billId', details: billId});
                    //AirFair Conditions
                        // Intra Airfare_5% (649)   [CGST_Airfare 2.5% (648) || SGST_Airfare 2.5% (647)]
                        // Inter Airfare_5% (651)   [IGST_Airfare 5% (650)] 
                        // Reversal_0% (305)        [Reversal_0% (293)]

                        if(Number(taxItemId) == 648) { airlineCGSTTpF = taxableAmount; }
                        if(Number(taxItemId) == 647) { airlineSGSTTpF = taxableAmount; }
                        if(Number(taxItemId) == 650) { airlineIGSTFive = taxableAmount; }

                    //RCM Conditions
                        if(isReversalProcs) {
                            billGrossAmt = taxableAmount;
                        }

                        /*log.debug({title: 'igstRate', details: igstRate});
                        log.debug({title: 'cgstRate', details: cgstRate});
                        log.debug({title: 'sgstRate', details: sgstRate});*/

                        if(Number(glAccountId) == Number(733)) {
                            
                            //IGST Rate
                            if(igstRate == "5.0%") {
                                igstRcmFive = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(igstRate == "12.0%") {
                                igstRcmTwelve = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(igstRate == "18.0%") {
                                igstRcmEighteen = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(igstRate == "28.0%") {
                                igstRcmTwentyEight = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }

                            //CGST Rate
                            if(cgstRate == "2.5%") {
                                cgstRcmTpf = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(cgstRate == "6.0%") {
                                cgstRcmSix = taxableAmount;
                                var cgstRcmSix = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(cgstRate == "9.0%") {
                                cgstRcmNine = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(cgstRate == "14.0%") {
                                cgstRcmFourteen = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }

                            //SGST Rate
                            if(sgstRate == "2.5%") {
                                sgstRcmTpf = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(sgstRate == "6.0%") {
                                sgstRcmTwelve = taxableAmount;
                                var cgstRcmSix = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(sgstRate == "9.0%") {
                                sgstRcmNine = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }
                            else if(sgstRate == "14.0%") {
                                sgstRcmFourteen = taxableAmount;
                                var cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '', cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '';
                            }


                        }//if(Number(glAccountId) == Number(733))


                    billId = billId.replace(/- None -/g, "");
                    billDate = billDate.replace(/- None -/g, "");
                    billActualDate = billActualDate.replace(/- None -/g, "");
                    vendor = vendor.replace(/- None -/g, "");
                    vendorCategory = vendorCategory.replace(/- None -/g, "");
                    vendorAddress = vendorAddress.replace(/- None -/g, "");
                    vendorGstNumber = vendorGstNumber.replace(/- None -/g, "");
                    glAccountNm = glAccountNm.replace(/- None -/g, "");
                    billGrossAmt = billGrossAmt.replace(/- None -/g, "");
                    taxableAmount = taxableAmount.replace(/- None -/g, "");
                    vendorHsnCode = vendorHsnCode.replace(/- None -/g, "");

                    cgstTPF = cgstTPF.replace(/- None -/g, "");
                    
                    if(isExport != "T" && isExport != "S") {
                        if(srNo) { poSubListObj.setSublistValue({id: 'custpage_srno', value: srNo, line: lineNo}); }
                        if(billId) { poSubListObj.setSublistValue({id: 'custpage_bill_no', value: billId, line: lineNo}); }
                        if(billDate) { poSubListObj.setSublistValue({id: 'custpage_bill_dt', value: billDate, line: lineNo}); }
                        if(billActualDate) { poSubListObj.setSublistValue({id: 'custpage_act_bill_dt', value: billActualDate, line: lineNo}); }
                        if(vendor) { poSubListObj.setSublistValue({id: 'custpage_vendor', value: vendor, line: lineNo}); }
                        if(vendorCategory) { poSubListObj.setSublistValue({id: 'custpage_vendor_cat', value: vendorCategory, line: lineNo}); }
                        if(vendorAddress) { poSubListObj.setSublistValue({id: 'custpage_vendor_addr', value: vendorAddress, line: lineNo}); }
                        if(vendorGstNumber) { poSubListObj.setSublistValue({id: 'custpage_vendor_gst_no', value: vendorGstNumber, line: lineNo}); }
                        if(glAccountNm) { poSubListObj.setSublistValue({id: 'custpage_glaccount', value: glAccountNm, line: lineNo}); }
                        if(billGrossAmt) { poSubListObj.setSublistValue({id: 'custpage_gross_amt', value: billGrossAmt, line: lineNo}); }
                        if(taxableAmount) { poSubListObj.setSublistValue({id: 'custpage_tax_amt', value: taxableAmount, line: lineNo}); }
                        if(vendorHsnCode) { poSubListObj.setSublistValue({id: 'custpage_hsn_code', value: vendorHsnCode, line: lineNo}); }
                        if(cgstTPF) { poSubListObj.setSublistValue({id: 'custpage_cgst_tpf', value: cgstTPF, line: lineNo}); }
                        if(sgstTPF) { poSubListObj.setSublistValue({id: 'custpage_sgst_tpf', value: sgstTPF, line: lineNo}); }
                        if(cgstSix) { poSubListObj.setSublistValue({id: 'custpage_cgst_six', value: cgstSix, line: lineNo}); }
                        if(sgstSix) { poSubListObj.setSublistValue({id: 'custpage_sgst_six', value: sgstSix, line: lineNo}); }
                        if(cgstNine) { poSubListObj.setSublistValue({id: 'custpage_cgst_nine', value: cgstNine, line: lineNo}); }
                        if(sgstNine) { poSubListObj.setSublistValue({id: 'custpage_sgst_nine', value: sgstNine, line: lineNo}); }
                        if(cgstFourteen) { poSubListObj.setSublistValue({id: 'custpage_cgst_forteen', value: cgstFourteen, line: lineNo}); }
                        if(sgstFourteen) { poSubListObj.setSublistValue({id: 'custpage_sgst_forteen', value: sgstFourteen, line: lineNo}); }
                        if(igstFive) { poSubListObj.setSublistValue({id: 'custpage_igst_five', value: igstFive, line: lineNo}); }
                        if(igstTwelve) { poSubListObj.setSublistValue({id: 'custpage_igst_twelve', value: igstTwelve, line: lineNo}); }
                        if(igstEighteen) { poSubListObj.setSublistValue({id: 'custpage_igst_eighteen', value: igstEighteen, line: lineNo}); }
                        if(igstTwentyEight) { poSubListObj.setSublistValue({id: 'custpage_igst_twentyeight', value: igstTwentyEight, line: lineNo}); }
                        
                        if(airlineCGSTTpF) { poSubListObj.setSublistValue({id: 'custpage_airline_cgst_tpf', value: airlineCGSTTpF, line: lineNo}); }
                        if(airlineSGSTTpF) { poSubListObj.setSublistValue({id: 'custpage_airline_sgst_tpf', value: airlineSGSTTpF, line: lineNo}); }
                        if(airlineIGSTFive) { poSubListObj.setSublistValue({id: 'custpage_airline_igst_five', value: airlineIGSTFive, line: lineNo}); }
                        if(igstRcmFive) { poSubListObj.setSublistValue({id: 'custpage_igst_rcm_five', value: igstRcmFive, line: lineNo}); }
                        if(igstRcmTwelve) { poSubListObj.setSublistValue({id: 'custpage_igst_rcm_twelve', value: igstRcmTwelve, line: lineNo}); }
                        if(igstRcmEighteen) { poSubListObj.setSublistValue({id: 'custpage_igst_rcm_eighteen', value: igstRcmEighteen, line: lineNo}); }
                        if(igstRcmTwentyEight) { poSubListObj.setSublistValue({id: 'custpage_igst_rcm_twentyeight', value: igstRcmTwentyEight, line: lineNo}); }
                        if(cgstRcmTpf) { poSubListObj.setSublistValue({id: 'custpage_cgst_rcm_tpf', value: cgstRcmTpf, line: lineNo}); } 
                        if(sgstRcmTpf) { poSubListObj.setSublistValue({id: 'custpage_sgst_rcm_tpf', value: sgstRcmTpf, line: lineNo}); }
                        if(cgstRcmSix) { poSubListObj.setSublistValue({id: 'custpage_cgst_rcm_six', value: cgstRcmSix, line: lineNo}); }
                        if(sgstRcmSix) { poSubListObj.setSublistValue({id: 'custpage_sgst_rcm_six', value: sgstRcmSix, line: lineNo}); }

                        if(cgstRcmNine) { poSubListObj.setSublistValue({id: 'custpage_cgst_rcm_nine', value: cgstRcmNine, line: lineNo}); }
                        if(sgstRcmNine) { poSubListObj.setSublistValue({id: 'custpage_sgst_rcm_nine', value: sgstRcmNine, line: lineNo}); }
                        if(cgstRcmFourteen) { poSubListObj.setSublistValue({id: 'custpage_cgst_rcm_forteen', value: cgstRcmFourteen, line: lineNo}); }
                        if(sgstRcmFourteen) { poSubListObj.setSublistValue({id: 'custpage_sgst_rcm_forteen', value: sgstRcmFourteen, line: lineNo}); }
                        


                        lineNo++;
                    }
                    else if(isExport == "T") {
                        tempFileContent += '<Row>'
                        
                            tempFileContent += '<Cell><Data ss:Type="String">'+srNo+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+billId+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+billDate+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+billActualDate+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+vendor+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+vendorCategory+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+vendorAddress+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+vendorGstNumber+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+glAccountNm+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+billGrossAmt+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+taxableAmount+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+vendorHsnCode+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstTPF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstTPF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstFourteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstFourteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstFive+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstTwelve+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstEighteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstTwentyEight+'</Data></Cell>'
                            
                            tempFileContent += '<Cell><Data ss:Type="String">'+airlineCGSTTpF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+airlineSGSTTpF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+airlineIGSTFive+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstRcmFive+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstRcmTwelve+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstRcmEighteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstRcmTwentyEight+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstRcmTpf+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstRcmTpf+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstRcmSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstRcmSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstRcmNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstRcmNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstRcmFourteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstRcmFourteen+'</Data></Cell>'
                            
                        tempFileContent += '</Row>';
                    }
                    
                }
                st = Number(ed);
            }
        }
        //log.debug({title: 'tempFileContent', details: tempFileContent});
        return tempFileContent;

    }

    function _generateORExportSalesReport(soSubListObj, currentPeriodId, subsidiaryId, customerId, isExport, expoParams) {

        var invoiceSearch = search.load({id: 'customsearch756'});
        var tempFileContent = '';
        var totalRange = invoiceSearch.runPaged().count;
        var srNoCount   = 1;
        var lineNo      = 0;
        //log.debug({title: "Search Length", details: totalRange});
        if(totalRange > 0) {
            var invoiceSearchFilter = invoiceSearch.filterExpression;
            if(currentPeriodId) {
                invoiceSearchFilter.push("AND");
                invoiceSearchFilter.push(['postingperiod', 'abs', currentPeriodId]);
            }
            if(subsidiaryId) {
                invoiceSearchFilter.push("AND");
                invoiceSearchFilter.push(['subsidiary', 'anyof', subsidiaryId]);
            }
            if(customerId) {
                invoiceSearchFilter.push("AND");
                invoiceSearchFilter.push(['mainname', 'anyof', customerId]);
            }
            //log.debug({title: 'invoiceSearchFilter', details: invoiceSearchFilter});
            invoiceSearch.filterExpression = invoiceSearchFilter;

            var searchRange = invoiceSearch.run();
            var ed = 0;
            
            var totalRange1 = invoiceSearch.runPaged().count;

            for(var st=ed;st<totalRange1;st++) {
                ed = st+999;
                if(totalRange1 < ed) {
                    ed = Number(totalRange1);
                }
                //log.debug({title: "St & Ed", details: st +" & "+ ed});
                var invoiceSearchResultSet = '';
                invoiceSearchResultSet = searchRange.getRange({start: Number(st), end: Number(ed)});
                
                //log.debug({title: 'invoiceSearchResultSet Length', details: invoiceSearchResultSet.length});

                for(var i=0;i<invoiceSearchResultSet.length;i++) {
                    var srNo = Number(srNoCount).toFixed(0);   srNoCount++;
                    var invoiceId = '', invoiceDate = '', customerName = '', customerAddress = '', customerGstNumber = '', vendorAddress = '',
                        glAccountNm = '', billGrossAmt = '', taxableAmount = '', hsnScaCode = '', taxRate = '',
                        cgstTPF = '', sgstTPF = '', cgstSix = '', sgstSix = '', cgstNine = '', sgstNine = '',
                        cgstFourteen = '', sgstFourteen = '', igstFive = '', igstTwelve = '', igstEighteen = '', igstTwentyEight = '',
                        

                    invoiceId           = invoiceSearchResultSet[i].getValue(searchRange.columns[0]);
                    invoiceDate         = invoiceSearchResultSet[i].getValue(searchRange.columns[1]);
                    customerName        = invoiceSearchResultSet[i].getValue(searchRange.columns[2]);
                    customerAddress     = invoiceSearchResultSet[i].getValue(searchRange.columns[3]);
                    customerGstNumber   = invoiceSearchResultSet[i].getValue(searchRange.columns[4]);
                    glAccountNm         = invoiceSearchResultSet[i].getText(searchRange.columns[7]);
                    billGrossAmt        = invoiceSearchResultSet[i].getValue(searchRange.columns[8]);
                    taxableAmount       = invoiceSearchResultSet[i].getValue(searchRange.columns[9]);
                    hsnScaCode          = invoiceSearchResultSet[i].getValue(searchRange.columns[5]);
                    taxRate             = invoiceSearchResultSet[i].getValue(searchRange.columns[6]);
                    cgstTPF             = invoiceSearchResultSet[i].getValue(searchRange.columns[16]);
                    sgstTPF             = invoiceSearchResultSet[i].getValue(searchRange.columns[17]);
                    cgstSix             = invoiceSearchResultSet[i].getValue(searchRange.columns[18]);
                    sgstSix             = invoiceSearchResultSet[i].getValue(searchRange.columns[19]);
                    cgstNine            = invoiceSearchResultSet[i].getValue(searchRange.columns[20]);
                    sgstNine            = invoiceSearchResultSet[i].getValue(searchRange.columns[21]);
                    cgstFourteen        = invoiceSearchResultSet[i].getValue(searchRange.columns[22]);
                    sgstFourteen        = invoiceSearchResultSet[i].getValue(searchRange.columns[23]);
                    igstFive            = invoiceSearchResultSet[i].getValue(searchRange.columns[24]);
                    igstTwelve          = invoiceSearchResultSet[i].getValue(searchRange.columns[25]);
                    igstEighteen        = invoiceSearchResultSet[i].getValue(searchRange.columns[26]);
                    igstTwentyEight     = invoiceSearchResultSet[i].getValue(searchRange.columns[27]);


                    invoiceId = invoiceId.replace(/- None -/g, "");
                    invoiceDate = invoiceDate.replace(/- None -/g, "");
                    customerName = customerName.replace(/- None -/g, "");
                    customerAddress = customerAddress.replace(/- None -/g, "");
                    customerGstNumber = customerGstNumber.replace(/- None -/g, "");
                    glAccountNm = glAccountNm.replace(/- None -/g, "");
                    billGrossAmt = billGrossAmt.replace(/- None -/g, "");
                    taxableAmount = taxableAmount.replace(/- None -/g, "");
                    hsnScaCode = hsnScaCode.replace(/- None -/g, "");
                    taxRate = taxRate.replace(/- None -/g, "");
                    
                    if(isExport != "S" && isExport != "T") {
                        
                        if(srNo) { soSubListObj.setSublistValue({id: 'custpage_so_srno', value: srNo, line: lineNo}); }
                        if(invoiceId) { soSubListObj.setSublistValue({id: 'custpage_so_inv_no', value: invoiceId, line: lineNo}); }
                        if(invoiceDate) { soSubListObj.setSublistValue({id: 'custpage_so_inv_dt', value: invoiceDate, line: lineNo}); }
                        if(customerName) { soSubListObj.setSublistValue({id: 'custpage_so_cust_nm', value: customerName, line: lineNo}); }
                        if(customerAddress) { soSubListObj.setSublistValue({id: 'custpage_so_cust_addr', value: customerAddress, line: lineNo}); }
                        if(customerGstNumber) { soSubListObj.setSublistValue({id: 'custpage_so_gst_no', value: customerGstNumber, line: lineNo}); }
                        if(glAccountNm) { soSubListObj.setSublistValue({id: 'custpage_so_gl_acc', value: glAccountNm, line: lineNo}); }
                        if(billGrossAmt) { soSubListObj.setSublistValue({id: 'custpage_so_total_amt', value: billGrossAmt, line: lineNo}); }
                        if(taxableAmount) { soSubListObj.setSublistValue({id: 'custpage_so_tax_amt', value: taxableAmount, line: lineNo}); }
                        if(hsnScaCode) { soSubListObj.setSublistValue({id: 'custpage_so_hsn_code', value: hsnScaCode, line: lineNo}); }
                        if(taxRate) { soSubListObj.setSublistValue({id: 'custpage_so_tax_rate', value: taxRate, line: lineNo}); }

                        if(cgstTPF) { soSubListObj.setSublistValue({id: 'custpage_so_cgst_tpf', value: cgstTPF, line: lineNo}); }
                        if(sgstTPF) { soSubListObj.setSublistValue({id: 'custpage_so_sgst_tpf', value: sgstTPF, line: lineNo}); }
                        if(cgstSix) { soSubListObj.setSublistValue({id: 'custpage_so_cgst_six', value: cgstSix, line: lineNo}); }
                        if(sgstSix) { soSubListObj.setSublistValue({id: 'custpage_so_sgst_six', value: sgstSix, line: lineNo}); }
                        if(cgstNine) { soSubListObj.setSublistValue({id: 'custpage_so_cgst_nine', value: cgstNine, line: lineNo}); }
                        if(sgstNine) { soSubListObj.setSublistValue({id: 'custpage_so_sgst_nine', value: sgstNine, line: lineNo}); }
                        if(cgstFourteen) { soSubListObj.setSublistValue({id: 'custpage_so_cgst_forteen', value: cgstFourteen, line: lineNo}); }
                        if(sgstFourteen) { soSubListObj.setSublistValue({id: 'custpage_so_sgst_forteen', value: sgstFourteen, line: lineNo}); }
                        if(igstFive) { soSubListObj.setSublistValue({id: 'custpage_so_igst_five', value: igstFive, line: lineNo}); }
                        if(igstTwelve) { soSubListObj.setSublistValue({id: 'custpage_so_igst_twelve', value: igstTwelve, line: lineNo}); }
                        if(igstEighteen) { soSubListObj.setSublistValue({id: 'custpage_so_igst_eighteen', value: igstEighteen, line: lineNo}); }
                        if(igstTwentyEight) { soSubListObj.setSublistValue({id: 'custpage_so_igst_twentyeight', value: igstTwentyEight, line: lineNo}); }

                        lineNo++;
                    }
                    else if(isExport == "S") {
                        tempFileContent += '<Row>'
                        

                            tempFileContent += '<Cell><Data ss:Type="String">'+srNo+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+invoiceId+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+invoiceDate+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+customerName+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+customerAddress+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+customerGstNumber+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+glAccountNm+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+billGrossAmt+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+taxableAmount+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+hsnScaCode+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+taxRate+'</Data></Cell>'

                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstTPF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstTPF+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstSix+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstNine+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+cgstFourteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+sgstFourteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstFive+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstTwelve+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstEighteen+'</Data></Cell>'
                            tempFileContent += '<Cell><Data ss:Type="String">'+igstTwentyEight+'</Data></Cell>'
                            
                        tempFileContent += '</Row>';
                    }
                    
                }
                st = Number(ed);
            }
        }
        //log.debug({title: 'tempFileContent', details: tempFileContent});
        return tempFileContent;


    }

    function _getPoExcelHeaders() {
        
        var headerString = '';

        headerString += '<Row><Cell ss:StyleID="s63"><Data ss:Type="String">Sr. No.</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Invoice No./ Credit Note No.</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Invoice Date</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Actual Invoice Date</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Name of the Service Provider</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Nature of Input Service</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Address of Service Provider</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">GST Number of Service Provider</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">GL ACCOUNT</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Total Bill Amount (Gross)</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Taxable value</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">VENDOR HSN/SAC CODE</Data></Cell>';
        
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-2.5%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-2.5%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-6%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-6%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-9%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-9%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-14%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-14%</Data></Cell>';

        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-5%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-12%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-18%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-28%</Data></Cell>';

        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Airline CGST-2.5%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Airline SGST-2.5%</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Airline IGST-5%</Data></Cell>';

        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-5% RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-12% RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-18% RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-28% RCM Payable</Data></Cell>';

        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-2.5%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-2.5%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-6%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-6%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-9%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-9%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-14%- RCM Payable</Data></Cell>';
        headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-14%- RCM Payable</Data></Cell>';

        headerString += '</Row>';
        return headerString;
    }

    function _getSoExcelHeaders() {
        
        var headerString = '';

        headerString += '<Row>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Sr. No.</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Invoice No.</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Date</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Name of Customer</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Address of Customer</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">GST Number of Customer</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">GL Account</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Total Bill Amount (Gross)</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Taxable Value</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">HSN/SCA CODE </Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">Tax Rate</Data></Cell>';
            
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-2.5%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-2.5%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-6%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-6%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-9%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-9%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">CGST-14%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">SGST-14%</Data></Cell>';

            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-5%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-12%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-18%</Data></Cell>';
            headerString += '<Cell ss:StyleID="s63"><Data ss:Type="String">IGST-28%</Data></Cell>';
        headerString += '</Row>';

        return headerString;
    }

    function _addAccoutingPeriods(periodFilter, currentPeriodId) {

        var accountingPeriodSearch = search.load({id: 'customsearch900'});
        var currentAccountingPeriod = '';
        //log.debug({title: 'accountingPeriodSearch Length', details: accountingPeriodSearch.runPaged().count});
        if(accountingPeriodSearch.runPaged().count > 0) {
            var resultSet = accountingPeriodSearch.run();
            resultSet.each(function(result) {

                var intId = result.getValue(resultSet.columns[0]);
                var AcNm = result.getValue(resultSet.columns[1]);
                var isCurrent = result.getValue(resultSet.columns[2]);
                var isDefault = false;
                if(currentPeriodId) {
                    if(currentPeriodId == intId) {
                        isDefault = true;
                        currentAccountingPeriod = intId;
                    }
                }
                else if(isCurrent == 1) {
                    isDefault = true;
                    currentAccountingPeriod = intId;
                }
                if(periodFilter) {
                    periodFilter.addSelectOption({value: intId, text: AcNm, isSelected: isDefault});
                }
                

                return true;
            });
        }

        return currentAccountingPeriod;

    }

    return {
        onRequest: onRequest
    }

 });