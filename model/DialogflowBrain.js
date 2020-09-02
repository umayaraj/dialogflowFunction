const { WebhookClient, Suggestion, Sessiosn } = require('dialogflow-fulfillment');
const moment = require('moment');
const firebaseBrain = require('./FirebaseBrain');
var axios = require('axios');

var goal = { "name": "", "endDate": "", "reason": "", "objective": "", "alarm": true, "status": false };
var selectedGoaltask = { "name": "", "startDate": "", "startTime": "", "endDate": "", "endTime": "" };
var selectedGoal = "";
var selectedTask = "";
var goalList = [];
var taskList = [];
var UID = "";

function master(request, response) {

    //   functions.logger.info("Hello logs!", {structuredData: true});
    const agent = new WebhookClient({ request: request, response: response });
    // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    async function uidSet(agent) {
        try {
            var userData = await firebaseBrain.readUser(agent.parameters.any);
            UID = agent.parameters.any;
            agent.add(`Hello ${userData.displayName}, Good day! What can I do for you today?`);
        } catch (error) {
            agent.add(error);
        }
    }
    function DefaultFallbackIntent(agent) {
        return agent.add('Sorry i miss that, can you say that again..');
    }
    function DefaultWelcomeIntent(agent) {
        return agent.add('Good day! What can I do for you today?');
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
    function resGoalReason(agent) {
        agent.add(`Let me rephrase what you said to make sure I got it. You want to achieve this goal because ${agent.parameters.reason}, correct?`);
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
    function GoalObjectiveCreate(agent) {
        agent.add(`your objective is to ${agent.parameters.objective} ?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    async function GoalObjectiveConfirmationYes(agent) {
        try {
            agent.context.delete('awaiting-goal-objective');
            agent.context.delete('goalobjectivecreate-followup');
            goal.objective = agent.parameters.objective;
            console.log(`Goal Data` + `uid : ${UID}` + JSON.stringify(goal));
            var data = JSON.stringify({ "uid": UID, "name": goal.name, "endDate": goal.endDate, "reason": goal.reason, "objective": goal.objective, "alarm": goal.alarm, "status": goal.status });
            var config = {
                method: 'post',
                url: 'https://us-central1-smartbot-decf.cloudfunctions.net/firebaseBrain/goal',
                headers: { 'Content-Type': 'application/json' },
                data: data
            };
            axios(config)
                .then((response) => { return console.log(JSON.stringify(response.data)); })
                .catch((error) => { console.log(error); });

            goal = {};
            
            agent.add(`Awesome! Your Goal is Created Successfully. Now, do you want to add tasks to this goal?`);
            agent.add(new Suggestion('yes'));
            agent.add(new Suggestion('no'));
        } catch (error) {
            console.error(error);
            agent.add(`Goal Save Error: ${error}`);
        }
    }
    function GoalObjectiveConfirmationNo(agent) {
        agent.add(`Oh, so your objective for this goal is to ${agent.parameters.objective}, right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    /*****************************************************Task Create**************************************/
    //Name
    function TaskNameCreate(agent) {
        // agent.context.delete('goalobjectiveconfirmationyes-followup');
        // agent.context.delete('goaljointaskconfirmationyes-followup');
        // selectedGoal = firebaseBrain.goalId;
        // if (selectedGoal) {
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
        // } else {
        //     return agent.add(`Please Select Goal then Add Task`);
        // }
    }
    function GoalJoinTaskConfirmationYesYes(agent) {
        task.taskName = agent.parameters.name;
        agent.context.delete('awaiting-task-name');
        agent.context.delete('goalobjectiveconfirmationyes-followup');
        agent.add(`Nice. Now, what is the starting date and time of the task?`);
        agent.add(new Suggestion('jun 25th at 5.30am'));
        return agent.add(new Suggestion('jun 25th at 6.30am'));
    }
    function GoalJoinTaskConfirmationYesNo(agent) {
        task.name = agent.parameters.name;
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalJoinTaskConfirmationYes(agent) {
        agent.context.delete('goalobjectiveconfirmationyes-followup');
        agent.context.delete('awaiting-task-start');
        task.name = agent.parameters.name;
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //**for read and task join */
    function ReadTaskCreateYes(agent) {
        task.name = agent.parameters.name;
        agent.context.delete('readtask-followup');
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function ReadTaskCreateNameConfirmationYes(agent) {
        task.name = agent.parameters.name;
        agent.context.delete('awaiting-task-name');
        agent.context.delete('readtaskcreateyes-followup');
        agent.add(`Nice. Now, what is the starting date and time of the task?`);
        agent.add(new Suggestion('jun 25th at 5.30am'));
        return agent.add(new Suggestion('jun 25th at 6.30am'));
    }
    function ReadTaskCreateNameConfirmationNo(agent) {
        task.name = agent.parameters.name;
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //**for read and goal join */
    function ReadAllGoalCreateYes(agent) {
        agent.context.delete('readallgoal-followup');
        agent.add(`${agent.parameters.goal},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function ReadAllGoalCreateConfirmationYes(agent) {
        goal.name = agent.parameters.goal;
        agent.context.delete('readallgoal-yes-followup');
        agent.context.delete('create-goal-name');
        agent.add(`That’s great. Now, what date do you wish to achieve this goal?`);
        agent.add(new Suggestion('june 25th'));
        return agent.add(new Suggestion('jan 1st'));
    }
    function ReadAllGoalCreateConfirmationNo(agent) {
        agent.add(`${agent.parameters.goal},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //** */
    function TaskNameConfirmationYes(agent) {
        task.name = agent.parameters.name;
        // agent.context.delete('awaiting-task-name');
        agent.context.delete('tasknamecreate-followup');
        agent.context.delete('goalobjectiveconfirmationyes-followup');
        agent.add(`Nice. Now, what is the starting date and time of the task?`);
        agent.add(new Suggestion('jun 25th at 5.30am'));
        return agent.add(new Suggestion('jun 25th at 6.30am'));
    }
    function TaskNameConfirmationNo(agent) {
        console.log(`Task No Res`);
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //Start Date
    function ResTaskStart(agent) {
        if (agent.parameters.start.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.start.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.start) {
            agent.add(`${moment.parseZone(agent.parameters.start).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function TaskStartConfirmationYes(agent) {
        agent.context.delete('awaiting-task-start');
        agent.context.delete('taskstartcreate-followup');

        if (agent.parameters.start.date_time) {
            task.startTime = agent.parameters.start.date_time;
        } else if (agent.parameters.start) {
            task.startTime = agent.parameters.start;
        }
        return agent.add(`Ok, great. Now, what is the end date and time of the task?`);
    }
    function TaskStartConfirmationNo(agent) {
        if (agent.parameters.start.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.start.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.start) {
            agent.add(`${moment.parseZone(agent.parameters.start).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    //End Date    
    function TaskEndChange(agent) {
        if (agent.parameters.end.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.end.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.end) {
            agent.add(`${moment.parseZone(agent.parameters.end).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function ResTaskEnd(agent) {
        if (agent.parameters.end.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.end.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.end) {
            agent.add(`${moment.parseZone(agent.parameters.end).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function TaskEndConfirmationYes(agent) {
        agent.context.delete('awaiting-task-end');
        agent.context.delete('taskendcreate-followup');

        if (agent.parameters.end.date_time) {
            task.endTime = agent.parameters.end.date_time;
        } else if (agent.parameters.end) {
            task.endTime = agent.parameters.end;
        }
        try {

            selectedGoal = firebaseBrain.goalId;
            console.log(`selectedGoal:${selectedGoal}`);
            firebaseBrain.saveTask(UID, selectedGoal, task);
            agent.add(`Your Task Created Successfully`);
            agent.add(new Suggestion('Create Goal'));
            agent.add(new Suggestion('Create Task'));
            agent.add(new Suggestion('Read All Task'));
            return agent.add(new Suggestion('Read All Goal'));
            // return allTaskUpdate();
        } catch (err) {
            console.log(err);
            return agent.add(`Task Creation Failed for PUSH Fun Error`);
        }

    }
    function TaskEndConfirmationNo(agent) {
        if (agent.parameters.end.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.end.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.end) {
            agent.add(`${moment.parseZone(agent.parameters.end).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    /*****************************************************Goal Change**************************************/
    //     function ChangeGoalName(agent) {
    //         agent.context.delete('awaiting-goal-name-change');
    //         agent.context.delete('goalnamecreate-followup');
    //         if (selectedGoalID) {
    //             goalRef.child(UID).child(selectedGoalID).update({ "goalName": agent.parameters.name });
    //             return agent.add(`Goal Name Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal first then Use Change Functionality`);
    //         }
    //     }
    //     function ChangeGoalDate(agent) {
    //         agent.context.delete('awaiting-goal-date-change');
    //         agent.context.delete('goaldatechange-followup');
    //         if (selectedGoalID) {
    //             goalRef.child(UID).child(selectedGoalID).update({ "goalName": agent.parameters.date });
    //             return agent.add(`Goal Date Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal first then Use Change Functionality`);
    //         }
    //     }
    //     function ChangeGoalReason(agent) {
    //         agent.context.delete('goalreasonchange-followup');
    //         agent.context.delete('awaiting-goal-reason-change');
    //         if (selectedGoalID) {
    //             goalRef.child(UID).child(selectedGoalID).update({ "goalEndDate": agent.parameters.reason });
    //             return agent.add(`Goal Reason Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal first then Use Change Functionality`);
    //         }
    //     }
    //     function ChangeGoalObjective(agent) {
    //         agent.context.delete('goalobjectivechange-followup');
    //         agent.context.delete('awaiting-goal-objective-change');
    //         if (selectedGoalID) {
    //             goalRef.child(UID).child(selectedGoalID).update({ "goalObjective": agent.parameters.objective });
    //             return agent.add(`Goal Objective Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal first then Use Change Functionality`);
    //         }
    //     }
    //     /*****************************************************Task Change**************************************/
    //     function ChangeTaskName(agent) {
    //         agent.context.delete('tasknamechange-followup');
    //         agent.context.delete('awaiting-task-name-change');
    //         if (selectedTaskID && selectedGoalID) {
    //             taskRef.child(selectedGoalID).child(selectedTaskID).update({ "taskName": agent.parameters.name });
    //             agent.add(`Task Name Changed Successfully`);
    //             return agent.add(new Suggestion('Review Task'));
    //         } else {
    //             return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
    //         }
    //     }
    //     function ChangeTaskStart(agent) {
    //         agent.context.delete('taskstartchange-followup');
    //         agent.context.delete('awaiting-task-start-change');
    //         if (selectedTaskID && selectedGoalID) {
    //             taskRef.child(selectedGoalID).child(selectedTaskID).update({ "startDateTime": agent.parameters.start.date_time });
    //             return agent.add(`Task Start Date & Time Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
    //         }
    //     }
    //     function ChangeTaskEnd(agent) {
    //         agent.context.delete('taskendchange-followup');
    //         agent.context.delete('awaiting-task-end-change');
    //         if (selectedTaskID && selectedGoalID) {
    //             taskRef.child(selectedGoalID).child(selectedTaskID).update({ "endDateTime": agent.parameters.end.date_time });
    //             return agent.add(`Task End Date & Time Changed Successfully`);
    //         } else {
    //             return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
    //         }
    //     }
    //     /***************************************************************************************************/

    let intentMap = new Map();
    intentMap.set('uidSet', uidSet);
    intentMap.set('Default Fallback Intent', DefaultFallbackIntent);
    intentMap.set('Default Welcome Intent', DefaultWelcomeIntent);

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
    intentMap.set('goal.reason.create', resGoalReason);
    intentMap.set('goal.reason.confirmation.yes', GoalReasonConfirmationYes);
    intentMap.set('goal.reason.confirmation.no', GoalReasonConfirmationNo);
    //  Objective
    intentMap.set('goal.objective.create', GoalObjectiveCreate); //
    intentMap.set('goal.objective.confirmation.yes', GoalObjectiveConfirmationYes); //
    intentMap.set('goal.objective.confirmation.no', GoalObjectiveConfirmationNo);
    //Goal Change
    // intentMap.set('goal.name.change.confirmation.yes', ChangeGoalName);
    // intentMap.set('goal.date.change.confirmation.yes', ChangeGoalDate);
    // intentMap.set('goal.reason.change.confirmation.yes', ChangeGoalReason);
    // intentMap.set('goal.objective.change.confirmation.yes', ChangeGoalObjective);
    //   //Read Intent
    //   intentMap.set('read.all.goal', readAllGoal);
    //   intentMap.set('read.task', readTask);
    //   intentMap.set('summary', summary);
    //   //Select Intent
    //   intentMap.set('goal.select', selectGoal);
    //   intentMap.set('task.select', selectTask);
    //   //Delete Intent
    //   intentMap.set('delete.goal', DeleteGoal);
    //   intentMap.set('delete.goal.confirmation.no', DeleteGoalConfirmationNo);
    //   intentMap.set('delete.goal.confirmation.yes', DeleteGoalConfirmationYes);
    //   intentMap.set('delete.task', DeleteTask);
    //   intentMap.set('delete.task.confirmation.yes', DeleteTaskConfirmationNo);
    //   intentMap.set('delete.task.confirmation.yes', DeleteTaskConfirmationYes);
    /*******************************************Task Create********************************************/
    //  Name:
    intentMap.set('task.name.create', TaskNameCreate);
    intentMap.set('task.name.confirmation.yes', TaskNameConfirmationYes);
    intentMap.set('task.name.confirmation.no', TaskNameConfirmationNo);
    //  Start Date:
    intentMap.set('task.start.create', ResTaskStart);
    intentMap.set('task.start.confirmation.no', TaskStartConfirmationNo);
    intentMap.set('task.start.confirmation.yes', TaskStartConfirmationYes);
    //  End Date:
    intentMap.set('task.end.create', ResTaskEnd);
    intentMap.set('task.end.change', TaskEndChange);
    intentMap.set('task.end.confirmation.no', TaskEndConfirmationNo);
    intentMap.set('task.end.confirmation.yes', TaskEndConfirmationYes);
    //Task Change
    // intentMap.set('task.name.change.confirmation.yes', ChangeTaskName);
    // intentMap.set('task.start.change.confirmation.yes', ChangeTaskStart);
    // intentMap.set('task.end.change.confirmation.yes', ChangeTaskEnd);
    /*******************************************Goal & Task Join********************************************/
    intentMap.set('goal.join.task.confirmation.yes', GoalJoinTaskConfirmationYes); //TaskNameCreate
    intentMap.set('goal.join.task.confirmation.yes.yes', GoalJoinTaskConfirmationYesYes);
    intentMap.set('goal.join.task.confirmation.yes.no', GoalJoinTaskConfirmationYesNo);
    /*******************************************Read Task & Task Creation if 0 Task ********************************************/
    intentMap.set('read.task.create.yes', ReadTaskCreateYes);
    intentMap.set('read.task.create.name.confirmation.yes', ReadTaskCreateNameConfirmationYes);
    intentMap.set('read.task.create.name.confirmation.no', ReadTaskCreateNameConfirmationNo);
    /*******************************************Read Goal & Goal Creation if 0 Goal********************************************/
    intentMap.set('read.all.goal.create.yes', ReadAllGoalCreateYes);
    intentMap.set('read.all.goal.create.confirmation.yes', ReadAllGoalCreateConfirmationYes);
    intentMap.set('read.all.goal.create.confirmation.no', ReadAllGoalCreateConfirmationNo);

    agent.handleRequest(intentMap);
}

module.exports = {
    master: master
}