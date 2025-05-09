const inquirer = require('inquirer');

async function test() {
    const answers = await inquirer.prompt([
        { type: 'input', name: 'test', message: 'Enter something:' }
    ]);
    console.log('You entered:', answers.test);
}

test();
