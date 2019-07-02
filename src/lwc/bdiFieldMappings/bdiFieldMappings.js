import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getFieldMappingsByObjectAndFieldSetNames from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.getFieldMappingsByObjectAndFieldSetNames';
import { registerListener, unregisterAllListeners, fireEvent} from 'c/pubsubNoPageRef';
import createDataImportFieldMapping
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.createDataImportFieldMapping';

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

const columns = [
    { label: 'Field Label', fieldName: 'Source_Field_Label_xxx', type: 'text', sortable: true },
    { label: 'Field API Name', fieldName: 'Source_Field_API_Name_xxx', type: 'text' },
    { label: 'Data Type', fieldName: 'Source_Field_Data_Type_xxx', type: 'text' },
        {
            label: 'Maps To', fieldName: '', type: 'text',
            cellAttributes: { iconName: { fieldName: 'Maps_To_Icon' }, iconPosition: 'right' }
        },
    { label: 'Field Label', fieldName: 'Target_Field_Label_xxx', type: 'text' },
    { label: 'Field API Name', fieldName: 'Target_Field_API_Name_xxx', type: 'text' },
    { label: 'Data Type', fieldName: 'Target_Field_Data_Type_xxx', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: actions } }
];

export default class bdiFieldMappings extends LightningElement {
    @track displayFieldMappings = false;
    @track isLoading = true;
    @track isModalOpen = false;
    @track columns = columns;
    @api objectMapping;
    @track fieldMappings;

    @api
    refresh() {
        this.isLoading = true;
        this.handleFieldMappings();
    }

    handleNavButton() {
        fireEvent(this.pageRef, 'showobjectmappings');
    }

    constructor(){
        super();
        this.template.addEventListener('deployment', this.handleDeploymentEvent);
    }

    handleDeploymentEvent(event) {
        console.log('*** ' + 'handling deployment event in fieldMapping.js' + ' ***');
        console.log(JSON.stringify(event));
        let deploymentId = event.detail.deploymentId;
        console.log(deploymentId);

        console.log('*** ' + 'dispatching from fieldMapping.js' + ' ***');
        this.dispatchEvent(new CustomEvent('deploymentNotification', {
            bubbles: true,
            composed: true,
            detail: deploymentId
        }));
    }

    connectedCallback() {
        registerListener('showobjectmappings', this.handleShowObjectMappings, this);
        registerListener('showfieldmappings', this.handleShowFieldMappings, this);
        registerListener('deleteRowFromTable', this.handleDeleteRowFromTable, this);
        registerListener('refresh', this.refresh, this);

        if (this.objectMapping) {
            this.handleFieldMappings();
        }
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleShowObjectMappings() {
        this.displayFieldMappings = false;
    }

    handleShowFieldMappings(event) {
        this.objectMapping = event.objectMapping;
        this.displayFieldMappings = true;
        this.refresh();
    }

    handleOpenModal() {
        fireEvent(this.pageRef, 'openModal', { objectMapping: this.objectMapping, row: undefined });
    }

    /*******************************************************************************
    * @description Call apex method 'getFieldMappingsByObjectMappingName' to get
    * a list of field mappings by their parent object mapping name
    *
    * @param name: Name of the object mapping received from parent component 
    */
    handleFieldMappings() {
        getFieldMappingsByObjectAndFieldSetNames({
                objectSetName: this.objectMapping.DeveloperName})
            .then((data) => {
                console.log('Field Mappings: ', this.log(data));
                this.fieldMappings = data;
                this.isLoading = false;
            })
            .catch((error) => {
                console.log(error);
                this.isLoading = false;
            });
    }

    /*******************************************************************************
    * @description Action handler for datatable row actions (i.e. edit, delete)
    *
    * @param event: Event containing row details of the action
    */
    handleRowAction(event) {
        console.log('bdiFieldMappings | handleRowAction()');
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {

            case 'delete':
                console.log('DELETE ACTION');
                console.log(this.log(row));
                this.isLoading = true;

                row.Is_Deleted_xxx = true;
                let clonedRow = JSON.stringify(row);

                createDataImportFieldMapping({fieldMappingString: clonedRow})
                    .then((data) => {
                        console.log(this.log(data));
                        this.handleDeleteResult(row);
                    })
                    .catch((error) => {
                        console.log(error);
                        this.isLoading = false;
                        this.showToast(
                            'Error',
                            '{0}. {1}. {2}.',
                            'error',
                            'sticky',
                            [error.body.exceptionType, error.body.message, error.body.stackTrace]);
                    });
                break;

            case 'edit':
                console.log('EDIT ACTION');
                console.log('Row: ', this.log(row));
                fireEvent(this.pageRef,'openModal', {
                    objectMapping: this.objectMapping,
                    row: row });
                break;

            default:
        }
    }

    handleDeleteResult(row) {
        this.logBold('bdiFieldMappingModal | handleDeleteResult');
        let that = this;
        setTimeout(function() {
            console.log('First Refresh');
            that.handleDeleteRowFromDatatable(row);
            that.isLoading = false;
            that.showToast(
                'Success',
                'Field mapping has been deleted.',
                'success');
        }, 5000, that);
    }

    handleDeleteRowFromDatatable(row) {
        const { DeveloperName } = row;
        const index = this.findRowIndexById(DeveloperName);
        if (index !== -1) {
            this.fieldMappings = this.fieldMappings
                .slice(0, index)
                .concat(this.fieldMappings.slice(index + 1));
            //this.refresh();
        }
    }

    findRowIndexById(DeveloperName) {
        let ret = -1;
        this.fieldMappings.some((row, index) => {
            if (row.DeveloperName === DeveloperName) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }

    showToast(title, message, variant, mode, messageData) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode,
            messageData: messageData
        });
        this.dispatchEvent(event);
    }

    // TODO: Delete later
    /*******************************************************************************
    * @description Parse proxy objects for debugging, mutating, etc
    *
    * @param object: Object to be parsed
    */
    log(object) {
        return JSON.parse(JSON.stringify(object));
    }

    logBold(string) {
        return console.log('%c ' + string, 'font-weight: bold; font-size: 16px;');
    }
}