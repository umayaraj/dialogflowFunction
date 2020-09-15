const { WebhookClient, Suggestion, Sessiosn } = require('dialogflow-fulfillment');
const moment = require('moment');
const firebaseBrain = require('./FirebaseBrain');
var axios = require('axios');
const admin = require('firebase-admin');

var goal = { "name": "", "endDate": "", "reason": "", "objective": "", "alarm": true, "status": false };
var task = { "name": "", "selectedGoal": "", "startDateTime": "", "endDateTime": "" };
var selectedGoalId = "";
var selectedTaskId = "";
var UID = "";
var taskList = [];
var goalList = [];

function master(request, response) {

    const agent = new WebhookClient({ request: request, response: response });
    // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
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
    function GoalObjectiveConfirmationYes(agent) {
        try {
            agent.context.delete('awaiting-goal-objective');
            agent.context.delete('goalobjectivecreate-followup');
            goal.objective = agent.parameters.objective;
            var data = JSON.stringify({ "uid": UID, "name": goal.name, "endDate": goal.endDate, "reason": goal.reason, "objective": goal.objective, "alarm": goal.alarm, "status": goal.status });
            var config = {
                method: 'post',
                url: 'https://us-central1-smartbot-decf.cloudfunctions.net/firebaseBrain/goal',
                headers: { 'Content-Type': 'application/json' },
                data: data
            };
            axios(config)
                .then((response) => {
                    selectedGoalId = response.data;
                    console.log(`New Goal Id:${selectedGoalId}`);
                    return JSON.stringify(selectedGoalId);
                }).catch((error) => { console.log(error); });

            goal = {};
            agent.add(`Awesome! Your Goal is Created Successfully. Now, do you want to add tasks to this goal?`);
            agent.add(new Suggestion('yes'));
            agent.add(new Suggestion('no'));
        } catch (error) {
            console.error(error);
            agent.add(`Sorry this time i can't to add goal,Can you try again once?`);
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
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function TaskNameCreateNo(agent) {
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function TaskNameCreateYes(agent) {
        task.name = agent.parameters.name;
        agent.add(`Nice. Now, what is the starting date and time of the task?`);
        agent.add(new Suggestion('jun 25th at 5.30am'));
        return agent.add(new Suggestion('jun 25th at 6.30am'));
    }
    //Start Date
    function TaskStartCreate(agent) {
        if (agent.parameters.start.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.start.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.start) {
            agent.add(`${moment.parseZone(agent.parameters.start).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
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
    function TaskStartConfirmationYes(agent) {
        agent.context.delete('awaiting-task-start');
        agent.context.delete('taskstartcreate-followup');

        if (agent.parameters.start.date_time) {
            task.startDateTime = agent.parameters.start.date_time;
        } else if (agent.parameters.start) {
            task.startDateTime = agent.parameters.start;
        }
        agent.add(`Ok, great. Now, what is the end date and time of the task?`);
        agent.add(new Suggestion('jun 25th at 5.30am'));
        return agent.add(new Suggestion('jun 25th at 6.30am'));
    }
    //End Date    
    function TaskEndCreate(agent) {
        if (agent.parameters.end.date_time) {
            agent.add(`${moment.parseZone(agent.parameters.end.date_time).format('MMMM Do YYYY h:mm A')} ,is that right?`);
        } else if (agent.parameters.end) {
            agent.add(`${moment.parseZone(agent.parameters.end).format('MMMM Do YYYY')} ,is that right?`);
        }
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
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
    async function TaskEndConfirmationYes(agent) {
        console.log(`Selected Goal Id:${selectedGoalId}`);
        agent.context.delete('awaiting-task-end');
        agent.context.delete('taskendcreate-followup');
        if (agent.parameters.end.date_time) {
            task.endDateTime = agent.parameters.end.date_time;
        } else if (agent.parameters.end) {
            task.endDateTime = agent.parameters.end;
        }
        try {
            var data = JSON.stringify({
                "uid": UID,
                "selectedGoal": selectedGoalId,
                "name": task.name,
                "startDateTime": task.startDateTime,
                "endDateTime": task.endDateTime,
                "alarm": false,
                "status": false
            });
            var config = {
                method: 'post',
                url: 'https://us-central1-smartbot-decf.cloudfunctions.net/firebaseBrain/task',
                headers: { 'Content-Type': 'application/json' },
                data: data
            };
            axios(config)
                .then((response) => { return console.log(JSON.stringify(response.data)); })
                .catch((error) => { console.log(error); });
            task = {};
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
    /*******************************************Goal & Task Join********************************************/
    function GoalJoinTaskConfirmationYes(agent) {
        agent.context.delete('goalobjectiveconfirmationyes-followup');
        // agent.context.delete('awaiting-task-start');
        task.name = agent.parameters.name;
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalJoinTaskConfirmationNo(agent) {
        agent.add(`No Problem, Now you can say one of the commands below ..`);
        agent.add(new Suggestion('create Task'));
        agent.add(new Suggestion('create Goal'));
        agent.add(new Suggestion('read All Goal'));
    }
    /***************************************************** Read **************************************/
    async function readAllGoal() {
        let tempRes = [];
        goalList = [];
        console.log(`Current user Id:${UID}`);
        try {
            var snapshot = await admin.firestore().collection('Data').doc(UID).collection('Goal').get();
        } catch (e) {
            console.log(e);
            return agent.add(`While read gola get Error,so can you Go back and come and try agin..`);
        }
        snapshot.forEach(element => {
            let id = element.id;
            let data = element.data();
            goalList.push({ id, ...data });
        });
        goalList.forEach((goal, goalIndex) => {
            let cusText = "";
            if (goalIndex === 0) {
                cusText = "Your First Goal";
            } else {
                cusText = "and Next Goal";
            }
            tempRes.push(`${cusText} Name ${goal.name} ${moment(goal.endDate).format("MMMM Do YYYY")} , You want to achieve this goal because: ${goal.reason},and your Objective for this goal is: ${goal.objective}`);
        });

        console.log(JSON.stringify(goalList));

        if (goalList.length === 0) { //If the user don't have any goal then this part will give output 
            agent.add(`Hey, I can see you that don't have any goals set up right now. If you want you can say add goal and i'll be happy to help`);
            agent.add(`Do you want to create a new goal or project for you?`);
            agent.add(new Suggestion('Yes'));
            return agent.add(new Suggestion('No'));
        } else if (goalList.length === 1) {  //If the user have only one goal then don't need to select that goal
            selectedGoalId = goalList[0].id !== null ? goalList[0].id : null;
            agent.add(tempRes);
            agent.add(new Suggestion('create Task'));
            agent.add(new Suggestion('create Goal'));
            agent.add(new Suggestion('Review Task'));
            agent.add(new Suggestion('delete goal'));
            agent.add(new Suggestion('Change goal Name'));
            agent.add(new Suggestion('Change goal End Date'));
            return agent.add(new Suggestion('Change goal Reason'));
        } else {
            agent.add(`Hi You Have Total ${tempRes.length} Goals ,These Are as follows :`);
            agent.add(tempRes);
            agent.add(new Suggestion('select first goal'));
            agent.add(new Suggestion('select second goal'));
            return agent.add(new Suggestion('select third goal'));
        }
    }
    function readAllGoalYes(agent) {
        agent.add(`${agent.parameters.goal},is that right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function readAllGoalNo(agent) {
        agent.add(`No Problem, Now you can say one of the commands below ..`);
        agent.add(new Suggestion('create Goal'));
        agent.add(new Suggestion('create Task'));
        agent.add(new Suggestion('read All Goal'));
    }
    async function readTask(agent) {
        taskList = [];
        let tempRes = [];
        console.log(selectedGoalId);
        if (selectedGoalId) {
            try {
                taskList = await firebaseBrain.readSingleGoalTask(UID, selectedGoalId);
            } catch (e) {
                console.log(e);
                agent.add(`Something wrong while read task in firebaseBrain`);
                return agent.add(new Suggestion('Read All Goal'));
            }
            taskList.forEach((task, goalIndex) => {
                let cusText = "";
                if (goalIndex === 0) {
                    cusText = "Your First Task";
                } else {
                    cusText = "and Next Task";
                }
                tempRes.push(`${cusText} Task Name ${task.name}, Start At ${moment.parseZone(task.startDateTime).format("MMMM Do YYYY h:mm A")} ,End Date and Time 
            ${moment.parseZone(task.endDateTime).format("MMMM Do YYYY h:mm A")} `);
            });
            if (taskList.length === 0) { //If the user don't have any goal then this part will give output 
                agent.add(`Hey, I can see you that don't have any task set up right now.`);
                agent.add(`Do you want to create a new task ?, i'll be happy to help..`);
                agent.add(new Suggestion('Yes'));
                return agent.add(new Suggestion('No'));
            } else if (taskList.length === 1) {  //If the user have only one goal then don't need to select that goal
                selectedTaskId = taskList[0].id !== null ? taskList[0].id : null;
                agent.add(tempRes);
                agent.add(`Yumm... I think that task is already selected and ready! Now you can say one of the options below..`);
                agent.add(new Suggestion('Change task Name'));
                agent.add(new Suggestion('Change Start Date'));
                agent.add(new Suggestion('Change End Date'));
                agent.add(new Suggestion('Change Start Time'));
                agent.add(new Suggestion('Change End Time'));
                return agent.add(new Suggestion('Remove task'));
            } else {
                agent.add(`Hi You Have Total ${taskList.length} Task ,These Are as follows :`);
                agent.add(tempRes);
                agent.add(new Suggestion('select first task'));
                agent.add(new Suggestion('select second task'));
                return agent.add(new Suggestion('select third task'));
            }
        }
        console.log(`taskList:${JSON.stringify(taskList)}`);
        console.log(`goalList:${JSON.stringify(goalList)}`);
        if (goalList.length === 0) { //If the user don't have any goal then this part will give output 
            agent.add(`Hey, I can see you that don't have any goals set up right now. If you want you can say add goal and i'll be happy to help`);
            agent.add(`Do you want to create a new goal or project for you?`);
            agent.add(new Suggestion('Yes'));
            return agent.add(new Suggestion('No'));
        } else {
            agent.add(`umm.. It looks like you have multiple goals, which is great! But could you please choose one to select?`);
            return agent.add(new Suggestion('Read All Goal'));
        }

    }
    function ReadTaskCreateYes(agent) {
        agent.add(`${agent.parameters.name},is that Right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function ReadTaskCreateNo(agent) {
        agent.add(`No Problem, Now you can say one of the commands below ..`);
        agent.add(new Suggestion('create Task'));
        agent.add(new Suggestion('create Goal'));
        agent.add(new Suggestion('read All Goal'));
        return agent.add(new Suggestion('read All Task'));
    }
    function summary(agent) {
        console.log(`DataArray1${JSON.stringify(DataArray1)}`);
        if (agent.parameters.date) {
            return agent.add(`Not Implememnt`);
        } else {
            return agent.add(`Sorry, i didn't really hear what you were saying. Mind if you repeat that one more time?`);
        }
    }
    /*****************************************************Select **************************************/
    function selectGoal(agent) {
        if (agent.parameters.ordinal || agent.parameters.number) {
            let userInput = agent.parameters.ordinal ? agent.parameters.ordinal : agent.parameters.number;
            if (goalList) {
                let temp = goalList[userInput - 1];
                if (temp) {
                    selectedGoalId = temp.id;
                    agent.add(`You have selected goal  ${temp.name}`);
                    agent.add(`Great, Now you can say one of the commands below ..`);
                    agent.add(new Suggestion('create Task'));
                    agent.add(new Suggestion('Review Task'));
                    agent.add(new Suggestion('delete goal'));
                    agent.add(new Suggestion('Change goal Name'));
                    agent.add(new Suggestion('Change goal End Date'));
                    return agent.add(new Suggestion('Change goal Reason'));
                } else {
                    agent.add(`Oh..Sorry, the goal number you selected was never added before`);
                    return agent.add(new Suggestion('Read All Goal'));
                }

            } else {
                return agent.add(`Hmmm… I don't think you have selected a goal. Maybe try doing that first and then lets talk`);
            }
        } else {
            return agent.add(`No Goal Selected,Please Try Again`);
        }
    }
    function selectTask(agent) {
        if (agent.parameters.ordinal || agent.parameters.number) {
            let userInput = agent.parameters.ordinal ? agent.parameters.ordinal : agent.parameters.number;
            if (taskList) {
                console.log(`taskList:${taskList}`);
                let temp = taskList[userInput - 1];
                if (temp) {
                    selectedTaskId = temp.id;
                    agent.add(`You selected Task name is ${temp.name}`);
                    agent.add(`Greate, Now you can do following functions..`);
                    agent.add(new Suggestion('Change task Name'));
                    agent.add(new Suggestion('Change Start Date'));
                    agent.add(new Suggestion('Change End Date'));
                    agent.add(new Suggestion('Change Start Time'));
                    agent.add(new Suggestion('Change End Time'));
                    return agent.add(new Suggestion('Remove task'));
                } else {
                    return agent.add(`Oh, Sorry Currently your selected number is never added before`);
                }
            } else {
                return agent.add(`Please ,use Summary of task to list,then select Task`);
            }
        } else {
            return agent.add(`No Task Selected,Please Try Again`);
        }
    }
    /*****************************************************Delete **************************************/
    function DeleteGoal(agent) {
        if (selectedGoalId) {
            agent.add(`Are you sure,Do you want to delete this Goal?`);
            agent.add(new Suggestion('yes'));
            return agent.add(new Suggestion('no'));
        } else {
            return agent.add(`Uhhh...maybe you should first select a goal, because i don't know which goal you would like to change`);
        }
    }
    async function DeleteGoalConfirmationYes(agent) {
        agent.context.delete('deletegoal-followup');
        agent.context.delete('delete-goal');
        if (selectedGoalId) {
            try {
                await firebaseBrain.deleteGoal(UID, selectedGoalId);
                agent.add(`Your selected goal deleted successfully`);
                agent.add(new Suggestion('Create Goal'));
                agent.add(new Suggestion('Create Task'));
                agent.add(new Suggestion('Read All Task'));
                return agent.add(new Suggestion('Read All Goal'));
            } catch (e) {
                return agent.add(`Sorry, something went wrong when tried to delete your goal. May be try again?`);
            }
        } else {
            return agent.add(`would you mind try again, as something was not right`);
        }
    }
    function DeleteGoalConfirmationNo(agent) {
        agent.context.delete('deletegoal-followup');
        agent.context.delete('delete-goal');
        agent.add(new Suggestion('Read All Goal'));
        return agent.add(`its okay you can delete later`);
    }
    function DeleteTask(agent) {
        if (selectedTaskId) {
            agent.add(`Are you sure,Do you want to delete selected task?`);
            agent.add(new Suggestion('yes'));
            return agent.add(new Suggestion('no'));

        } else {
            return agent.add(`Please Select Goal first then Use Change Functionality`);
        }
    }
    function DeleteTaskConfirmationNo(agent) {
        agent.context.delete('deletetask-followup');
        agent.context.delete('delete-task');
        agent.add(new Suggestion('Read Task'));
        return agent.add(`its okay you can delete later`);
    }
    async function DeleteTaskConfirmationYes(agent) {
        agent.context.delete('deletetask-followup');
        agent.context.delete('delete-task');
        try {
            await firebaseBrain.deleteTask(UID, selectedGoalId, selectedTaskId);
            agent.add(`Your Selected Task Deleted Successfully`);
            agent.add(new Suggestion('Create Goal'));
            agent.add(new Suggestion('Create Task'));
            agent.add(new Suggestion('Read All Task'));
            return agent.add(new Suggestion('Read All Goal'));
        } catch (e) {
            console.log(e);
            return agent.add(`Task Delete Failed`);
        }
    }
    /*****************************************************Goal Change**************************************/
    async function ChangeGoalName(agent) {
        agent.context.delete('awaiting-goal-name-change');
        agent.context.delete('goalnamecreate-followup');
        if (selectedGoalId) {
            await firebaseBrain.updateGoal(UID, selectedGoalId, { "name": agent.parameters.name });
            return agent.add(`Goal Name Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal first then Use Change Functionality`);
        }
    }
    function GoalDateChange(agent) {
        agent.add(`${moment(agent.parameters.date).format("MMMM Do YYYY")},is that right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    function GoalDateChangeConfirmationNo(agent) {
        agent.add(`${moment(agent.parameters.date).format("MMMM Do YYYY")},is that right?`);
        agent.add(new Suggestion('yes'));
        return agent.add(new Suggestion('no'));
    }
    async function GoalDateChangeConfirmationYes(agent) {
        agent.context.delete('awaiting-goal-date-change');
        agent.context.delete('goaldatechange-followup');
        if (selectedGoalId) {
            await firebaseBrain.updateGoal(UID, selectedGoalId, { "endDate": agent.parameters.date });
            return agent.add(`Goal Date Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal first then Use Change Functionality`);
        }
    }
    async function ChangeGoalReason(agent) {
        agent.context.delete('goalreasonchange-followup');
        agent.context.delete('awaiting-goal-reason-change');
        if (selectedGoalId) {
            await firebaseBrain.updateGoal(UID, selectedGoalId, { "reason": agent.parameters.reason });
            return agent.add(`Goal Reason Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal first then Use Change Functionality`);
        }
    }
    async function ChangeGoalObjective(agent) {
        agent.context.delete('goalobjectivechange-followup');
        agent.context.delete('awaiting-goal-objective-change');
        if (selectedGoalId) {
            await firebaseBrain.updateGoal(UID, selectedGoalId, { "objective": agent.parameters.objective });
            return agent.add(`Goal Objective Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal first then Use Change Functionality`);
        }
    }
    /*****************************************************Task Change**************************************/
    async function ChangeTaskName(agent) {
        agent.context.delete('tasknamechange-followup');
        agent.context.delete('awaiting-task-name-change');
        if (selectedGoalId && selectedTaskId) {
            await firebaseBrain.updateTask(UID, selectedGoalId, selectedTaskId, { "name": agent.parameters.name });
            agent.add(`Task Name Changed Successfully`);
            return agent.add(new Suggestion('Review Task'));
        } else {
            return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
        }
    }
    async function ChangeTaskStart(agent) {
        agent.context.delete('taskstartchange-followup');
        agent.context.delete('awaiting-task-start-change');
        if (selectedGoalId && selectedTaskId) {
            await firebaseBrain.updateTask(UID, selectedGoalId, selectedTaskId, { "startDateTime": agent.parameters.start.date_time });
            return agent.add(`Task Start Date & Time Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
        }
    }
    async function ChangeTaskEnd(agent) {
        agent.context.delete('taskendchange-followup');
        agent.context.delete('awaiting-task-end-change');
        if (selectedGoalId && selectedTaskId) {
            await firebaseBrain.updateTask(UID, selectedGoalId, selectedTaskId, { "endDateTime": agent.parameters.end.date_time });
            return agent.add(`Task End Date & Time Changed Successfully`);
        } else {
            return agent.add(`Please Select Goal and Task then Use Change Task Functionality`);
        }
    }
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
    intentMap.set('goal.objective.create', GoalObjectiveCreate);
    intentMap.set('goal.objective.confirmation.yes', GoalObjectiveConfirmationYes);
    intentMap.set('goal.objective.confirmation.no', GoalObjectiveConfirmationNo);
    //Goal Change
    intentMap.set('goal.name.change.confirmation.yes', ChangeGoalName);
    intentMap.set('goal.date.change', GoalDateChange);
    intentMap.set('goal.date.change.confirmation.yes', GoalDateChangeConfirmationYes);
    intentMap.set('goal.date.change.confirmation.no', GoalDateChangeConfirmationNo);
    intentMap.set('goal.reason.change.confirmation.yes', ChangeGoalReason);
    intentMap.set('goal.objective.change.confirmation.yes', ChangeGoalObjective);
    /*******************************************Task Create********************************************/
    //  Name:
    intentMap.set('task.name.create', TaskNameCreate);
    intentMap.set('task.name.create.yes', TaskNameCreateYes);
    intentMap.set('task.name.create.no', TaskNameCreateNo);
    //  Start Date:
    intentMap.set('task.start.create', TaskStartCreate);
    intentMap.set('task.start.confirmation.no', TaskStartConfirmationNo);
    intentMap.set('task.start.confirmation.yes', TaskStartConfirmationYes);
    //  End Date:
    intentMap.set('task.end.create', TaskEndCreate);
    intentMap.set('task.end.confirmation.no', TaskEndConfirmationNo);
    intentMap.set('task.end.confirmation.yes', TaskEndConfirmationYes);
    //Task Change
    intentMap.set('task.name.change.confirmation.yes', ChangeTaskName);
    intentMap.set('task.start.change.confirmation.yes', ChangeTaskStart);
    intentMap.set('task.end.change.confirmation.yes', ChangeTaskEnd);
    /*******************************************Goal & Task Join********************************************/
    intentMap.set('goal.objective.confirmation.yes.yes', GoalJoinTaskConfirmationYes);
    intentMap.set('goal.objective.confirmation.yes.no', GoalJoinTaskConfirmationNo);
    /*******************************************Read Intent********************************************/
    intentMap.set('read.all.goal', readAllGoal);
    intentMap.set('read.all.goal.yes', readAllGoalYes);
    intentMap.set('read.all.goal.no', readAllGoalNo);
    intentMap.set('read.task', readTask);
    intentMap.set('read.task.create.yes', ReadTaskCreateYes);
    intentMap.set('read.task.create.no', ReadTaskCreateNo);
    intentMap.set('summary', summary);
    //Add 4 intent for change task start and end date
    /*******************************************Select Intent********************************************/
    intentMap.set('goal.select', selectGoal);
    intentMap.set('task.select', selectTask);
    /*******************************************Delete Intent********************************************/
    //Goal
    intentMap.set('delete.goal', DeleteGoal);
    intentMap.set('delete.goal.confirmation.no', DeleteGoalConfirmationNo);
    intentMap.set('delete.goal.confirmation.yes', DeleteGoalConfirmationYes);
    //Task
    intentMap.set('delete.task', DeleteTask);
    intentMap.set('delete.task.confirmation.yes', DeleteTaskConfirmationNo);
    intentMap.set('delete.task.confirmation.yes', DeleteTaskConfirmationYes);

    agent.handleRequest(intentMap);
}

module.exports = {
    master: master
}