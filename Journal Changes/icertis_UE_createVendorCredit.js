/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/log'],

function(record, search, log) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	
		if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE) {
			
			
			
		}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    
    //Function to execute on save of Write check to create a Vendor Credit is it's Advances paid to Vendor.
    function afterSubmit(scriptContext) {
    	
		try{
			log.debug("scriptContext.type", scriptContext.type);
			
			if(scriptContext.type == 'create' || scriptContext.type == 'edit'){
				
				//Determine the current record type and record id
				var recType = scriptContext.newRecord.type;
				var recId = scriptContext.newRecord.id;
				var advancePendingApportionAccount = 746;
				
				log.debug("recType", recType);
				log.debug("recId", recId);
				
				//Load the check record to determine all the required values.
				var loadRecord = record.load({
					type:record.Type.CHECK,
					id: recId,
				});
				
				//Determine PO and Related Vendor Credit field value.
				var getRelatedPO = loadRecord.getValue({
					fieldId:'custbody_ic_wc_va_related_po'
				});
				
				var getRelatedVC = loadRecord.getValue({
					fieldId:'custbody_ic_wc_rvc'
				});
				
				var vendorAdvanceCheck = loadRecord.getValue({
					fieldId:'custbody_ic_vendoradvance'
				});
				
				log.debug('vendorAdvanceCheck',vendorAdvanceCheck);
				
				//If Related PO is selected and Related Vendor Credit is blank(i.e. it's not created) process the check to create vendor credit.
				if(vendorAdvanceCheck && (getRelatedVC == '' || getRelatedVC == null)) {
					
					//Determine all the required fields to create Vendor Credit.
					var getPayee = loadRecord.getValue({
						fieldId:'entity'
					});
					
					var vendorSearchObj = search.create({
						   type: "vendor",
						   filters:
						   [
							  ["internalid","anyof",getPayee]
						   ],
						   columns:
						   [
							  search.createColumn({name: "internalid"})
						   ]
						});
					
					var searchResult = vendorSearchObj.run().getRange({
					 start: 0,
					 end: 1
					 });
				   
					log.debug("After Submit searchResult", searchResult);
					
					if(searchResult){
						var internalId = searchResult[0].getValue({
							name : 'internalid'
						});
							
						log.debug("After Submit internalId", internalId);
					
						
						var getDate = loadRecord.getValue({
							fieldId:'trandate'
						});
						
						var getMemo = loadRecord.getValue({
							fieldId:'memo'
						});
						
						var getSubsidiary = loadRecord.getValue({
							fieldId:'subsidiary'
						});
						
						var getDepartment = loadRecord.getValue({
							fieldId:'department'
						});
						
						var getLocation = loadRecord.getValue({
							fieldId:'location'
						});
						
						log.debug("All Body Details", "getPayee : "+getPayee+" getDate : "+getDate+" getSubsidiary : "+getSubsidiary+" getDepartment : "+getDepartment+" getLocation : "+getLocation);
						
						//Convert the date string to date format.
						getDate = new Date(getDate);
						
						//Create Vendor Credit record for the related check.
						var createVC = record.create({
							type:record.Type.VENDOR_CREDIT,
							isDynamic: true,
						});
						
						createVC.setValue({
							fieldId:'entity',
							value:getPayee
						});
						
						createVC.setValue({
							fieldId:'trandate',
							value:getDate
						});
						
						createVC.setValue({
							fieldId:'subsidiary',
							value:getSubsidiary
						});
						
						createVC.setValue({
							fieldId:'department',
							value:getDepartment
						});
						
						createVC.setValue({
							fieldId:'location',
							value:getLocation
						});
						
					  createVC.setValue({
							fieldId:'custbody_pp_vc_rac',
							value:recId
						});
					  
						createVC.setValue({
							fieldId:'custbody_ic_wc_va_related_po',
							value:getRelatedPO
						});
						
						//Determine the line item count to get line details.
						var getLineCount = loadRecord.getLineCount({
							sublistId:'item'
						});
						
						log.debug('getLineCount',getLineCount);
						
						//Process and get data of all the lines and create vendor credit item lines.
						for(var e = 0; e < getLineCount; e++) {
							
							//Determine all the line values required.
							var getItem = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'item',
							  line:e
							});
							log.debug('getItem',getItem);
							
							var getLineQuantity = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'quantity',
							  line:e
							});
							log.debug('getLineQuantity',getLineQuantity);
							
							var getLineUnit = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'units',
							  line:e
							});
							log.debug('getLineUnit',getLineUnit);
							
							var getLineDecription = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'description',
							  line:e
							});
							log.debug('getLineDecription',getLineDecription);
							
							var getLineRate = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'rate',
							  line:e
							});
							log.debug('getLineRate',getLineRate);
							
							var getLineAmount = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'amount',
							  line:e
							});
							log.debug('getLineAmount',getLineAmount);
							
							var getLineLocation = loadRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'location',
							  line:e
							});
							log.debug('getLineLocation',getLineLocation);
							
							//Set the line on Vendor Credit.
							createVC.selectNewLine({
								sublistId: 'item'
							});
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'item',
								value:getItem
							});
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'quantity',
								value:getLineQuantity
							});
							
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'description',
								value:getLineDecription
							});
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'rate',
								value:getLineRate
							});
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'amount',
								value:getLineAmount
							});
							
							createVC.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: 'location',
								value:getLineLocation
							});
							
							createVC.commitLine({
								sublistId:'item'
							});
						
						}
						
						//Determine the line item count to get line details.
						var getLineCountE = loadRecord.getLineCount({
							sublistId:'expense'
						});
						log.debug('getLineCountE',getLineCountE);
						
						var advanceAmount = Number(0);
						
						//Process and get data of all the lines and create vendor credit expense lines.
						for(var f = 0; f < getLineCountE; f++) {
							
							//Determine all the line values required.
							var getLineAccountE = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'account',
							  line:f
							});
							log.debug('getLineAccountE',getLineAccountE);
							
							var getLineAmountE = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'amount',
							  line:f
							});
							log.debug('getLineAmountE',getLineAmountE);
							
							var getLineMemoE = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'memo',
							  line:f
							});
							log.debug('getLineMemoE',getLineMemoE);
							
							var getLineLocationE = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'location',
							  line:f
							});
							log.debug('getLineLocationE',getLineLocationE);
							
							var getLineCustomerE = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'customer',
							  line:f
							});
							log.debug('getLineCustomerE',getLineCustomerE);
							
							var getWithHoldingTax = loadRecord.getSublistValue({
								sublistId: 'expense',
								fieldId: 'custcol_4601_witaxapplies',
							    line:f
							});
							log.debug('getWithHoldingTax',getWithHoldingTax);
							
							
							if((getWithHoldingTax == 'false' || getWithHoldingTax == false) && getLineCountE == 1) {
								
								//Set the line on Vendor Credit.
								createVC.selectNewLine({
									sublistId: 'expense'
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'account',
									value:getLineAccountE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'amount',
									value:getLineAmountE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'memo',
									value:getLineMemoE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'location',
									value:getLineLocationE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'customer',
									value:getLineCustomerE
								});

								createVC.commitLine({
									sublistId:'expense'
								});
								
								
							}
							else if((getWithHoldingTax == 'true' || getWithHoldingTax == true) && getLineCountE > 1){
								
								//Get amount from the line
								advanceAmount = loadRecord.getSublistValue({
									sublistId: 'expense',
									fieldId: 'amount',
								    line:f
								});
								log.debug('advanceAmount',advanceAmount);
								
							}
							else if((getWithHoldingTax == 'false' || getWithHoldingTax == false) && getLineCountE > 1){
								
								//add current line with global declared variable for amount.
								//Set the line on Vendor Credit.
								createVC.selectNewLine({
									sublistId: 'expense'
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'account',
									value:advancePendingApportionAccount    //xxxx
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'amount',
									value:advanceAmount
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'memo',
									value:getLineMemoE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'location',
									value:getLineLocationE
								});
								
								createVC.setCurrentSublistValue({
									sublistId: 'expense',
									fieldId: 'customer',
									value:getLineCustomerE
								});

								createVC.commitLine({
									sublistId:'expense'
								});
								
							}
							
						}
						
						var submitVC = createVC.save();
						
						//Link Related Vendor Credit Created back on Check. 
						record.submitFields({
							type:record.Type.CHECK,
							id:recId,
							values: {
								'custbody_ic_wc_rvc':submitVC
							}
						});
						
						//Link Related Check Created back Vendor Credit. 
						record.submitFields({
							type:record.Type.VENDOR_CREDIT,
							id:submitVC,
							values: {
								'custbody_ic_wc_rvc':recId
							}
						});
						
						return true;
					}
				}
				
				return true;
				
			}
		}
		catch(ex){
			log.debug(' Error Scheduled Creating Subscription Item SO ', ex.message);
		}
	}
    return {
//        beforeLoad: beforeLoad, abc
//        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});