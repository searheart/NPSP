({
    /**
     * @description: handles ltng:sendMessage from child component
     */
    handleMessage: function(component, event) {
        //todo: see if the entire set of progress steps can be dynamic (appears there might be a bug?) https://success.salesforce.com/ideaView?id=0873A000000TuFUQA0
        var channel = event.getParam('channel');
        var message = event.getParam('message');

        if (channel === 'setStep') {
            component.set('v.currentStep', message);
        } else if (channel === 'dataTableChanged') {
            component.set('v.dataTableChanged', message);
        }
    },

    /**
     * @description: sends back event to modal
     */
    back: function(component, event, helper) {
        helper.sendMessage(component, 'back');
    },

    /**
     * @description: sends cancel event to modal
     */
    cancel: function(component, event, helper) {
        helper.sendMessage(component, 'cancel');
    },

    /**
     * @description: sends next event to modal
     */
    next: function(component, event, helper) {
        helper.sendMessage(component, 'next');
    },

    /**
     * @description: sends save event to modal
     */
    save: function(component, event, helper) {
        helper.sendMessage(component, 'save');
        //todo: add validation, put this in another listener function
        component.find("overlayLib").notifyClose();
    }

})