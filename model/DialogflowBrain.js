const { WebhookClient, Suggestion } = require('dialogflow-fulfillment');
const moment = require('moment');
const firebaseBrain = require('./FirebaseBrain');

var goal = { "uid": "", "name": "", "endDate": "", "reason": "", "objective": "", "alarm": true, "status": false };

function master(request, response) {

    //   functions.logger.info("Hello logs!", {structuredData: true});
    const agent = new WebhookClient({ request: request, response: response });

    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    async function uidSet(agent) {
        var userData = await firebaseBrain.readUser(agent.parameters.any);
        agent.add(`Hello ${userData.displayName}, Good day! What can I do for you today?`);
    }

    /*****************************************************Goal Create **************************************/
    //Name
    function GoalNameCreate(agent) {
        agent.add(`${agent.parameters.goal},is that right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalNameConfirmationYes(agent) {
        goal.name = agent.parameters.goal;
        agent.context.delete('goalnamecreate-followup');
        agent.context.delete('create-goal-name');
        agent.add(`That’s great. Now, what date do you wish to achieve this goal?`);
        agent.add(new Suggestion('june 25th'));
        return agent.add(new Suggestion('jan 1st'));
    }
    function GoalNameConfirmationNo(agent) {
        agent.add(`${agent.parameters.goal},correct?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //Date
    function ResGoalDate(agent) {
        agent.add(`${moment(agent.parameters.date).format("MMMM Do YYYY")},is that right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalDateConfirmationYes(agent) {
        goal.endDate = agent.parameters.date;
        agent.context.delete('goaldatecreate-followup');
        agent.context.delete('awaiting-goal-date');
        return agent.add(`For the next step, do you mind telling me why you want to achieve this goal?, your primary objective`);
    }
    function GoalDateConfirmationNo(agent) {
        agent.add(`${moment(agent.parameters.date).format("MMMM Do YYYY")},is that right? `);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //Reason
    function resGoalReasonCreate(agent) {
        agent.add(`Let me rephrase what you said to make sure I got it. You want to achieve this goal ${agent.parameters.reason}, correct?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalReasonConfirmationYes(agent) {
        goal.reason = agent.parameters.reason;
        agent.context.delete('awaiting-goal-reason');
        agent.context.delete('goalreasoncreate-followup');
        return agent.add(`How will your life be impacted by achieving your goal? This is your secondary objective.`);
    }
    function GoalReasonConfirmationNo(agent) {

        agent.add(`You want to achieve this goal because ${agent.parameters.reason} is that right? `);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //Objective
    function ResGoalObjective(agent) {
        agent.add(`your objective is ${agent.parameters.objective} ?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalObjectiveConfirmationNo(agent) {
        agent.add(`Oh, so your objective for this goal is to ${agent.parameters.objective}, right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    async function GoalObjectiveConfirmationYes(agent) {
        goal.uid = 'lWLVfeGhVhZL2yXVFomnXGk8J9K2';
        let uid = goal.uid;
        delete goal.uid;
        goal.objective = agent.parameters.objective;
        await firebaseBrain.saveGoal(uid, goal);
        // selectedGoalID = newPostedKey.key;
        agent.context.delete('awaiting-goal-objective');
        agent.context.delete('goalobjectivecreate-followup');
        goal = {};
        agent.add(`Awesome! Your Goal is Created Successfully. Now, do you want to add tasks to this goal?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }

    let intentMap = new Map();
    intentMap.set('uidSet', uidSet);

    /*******************************************Goal Create********************************************/
    //  Name
    intentMap.set('goal.name.create', GoalNameCreate);
    intentMap.set('goal.name.confirmation.yes', GoalNameConfirmationYes);
    intentMap.set('goal.name.confirmation.no', GoalNameConfirmationNo);
    //  Date
    intentMap.set('goal.date.create', ResGoalDate);
    intentMap.set('goal.date.confirmation.yes', GoalDateConfirmationYes);
    intentMap.set('goal.date.confirmation.no', GoalDateConfirmationNo);
    //  Reason
    intentMap.set('goal.reason.create', resGoalReasonCreate);
    intentMap.set('goal.reason.confirmation.yes', GoalReasonConfirmationYes);
    intentMap.set('goal.reason.confirmation.no', GoalReasonConfirmationNo);
    //  Objective
    intentMap.set('goal.objective.create', ResGoalObjective);
    intentMap.set('goal.objective.confirmation.yes', GoalObjectiveConfirmationYes);
    intentMap.set('goal.objective.confirmation.no', GoalObjectiveConfirmationNo);
    // //Goal Change
    // intentMap.set('goal.name.change.confirmation.yes', ChangeGoalName);
    // intentMap.set('goal.date.change.confirmation.yes', ChangeGoalDate);
    // intentMap.set('goal.reason.change.confirmation.yes', ChangeGoalReason);
    // intentMap.set('goal.objective.change.confirmation.yes', ChangeGoalObjective);

    agent.handleRequest(intentMap);
}

module.exports = {
    master: master
}