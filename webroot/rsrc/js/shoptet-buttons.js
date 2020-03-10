/**
 * @provides shoptet-buttons
 */

// Available highlight values: green, red, blue
// Supported pages: differential revision and maniphest task
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const form = document.querySelector('.phui-comment-has-actions');
      if (form) {
        const action = form.getAttribute('action');
        let commands = false;
        let commandsRevision = {
          'accept': {
            label: 'Accept',
            visible: true,
            highlighted: 'green'
          },
          'reject': {
            label: 'Request changes',
            visible: true,
            highlighted: 'red'
          },
          'resign': {
            label: 'Resign as reviewer',
            visible: true,
            highlighted: false
          },
          'commandeer': {
            label: 'Commandeer',
            visible: true,
            highlighted: false
          },
          'request-review': {
            label: 'Request review',
            visible: true,
            highlighted: false
          },
          'plan-changes': {
            label: 'Plan changes',
            visible: true,
            highlighted: false
          },
          'close': {
            label: 'Close',
            visible: true,
            highlighted: false
          },
          'abandon': {
            label: 'Abandon',
            visible: true,
            highlighted: false
          },
          'reviewers': {
            label: 'Reviewers',
            visible: true,
            highlighted: false
          },
          'projectPHIDs': {
            label: '🏷 Tags',
            visible: true,
            highlighted: false
          },
          'subscriberPHIDs': {
            label: 'Subscribers',
            visible: true,
            highlighted: false
          },
          'mfa': {
            label: 'Sign With MFA',
            visible: false,
            highlighted: false
          }
        };
        let commandsTask = {
          'owner': {
            label: 'Assign',
            visible: true,
            highlighted: false
          },
          'status': {
            label: 'Status',
            visible: true,
            highlighted: false
          },
          'priority': {
            label: 'Priority',
            visible: true,
            highlighted: false
          },
          'points': {
            label: 'Story points',
            visible: true,
            highlighted: false
          },
          'column': {
            label: 'Move on workboard',
            visible: true,
            highlighted: false
          },
          'projectPHIDs': {
            label: '🏷 Tags',
            visible: true,
            highlighted: false
          },
          'subscriberPHIDs': {
            label: 'Subscribers',
            visible: true,
            highlighted: false
          },
          'mfa': {
            label: 'Sign With MFA',
            visible: false,
            highlighted: false
          }
        };
        if (action.match(/revision/i)) {
          let customCommands = typeof shoptetCommandsRevision === 'undefined' ? {} : shoptetCommandsRevision;
          commands = {...commandsRevision, ...customCommands};
        } else if (action.match(/task/i)) {
          let customCommands = typeof shoptetCommandsTask === 'undefined' ? {} : shoptetCommandsTask;
          commands = {...commandsTask, ...customCommands};
        }

        if (commands !== false) {
          const select = form.querySelector('select');
          const buttons = document.createElement('div');
          buttons.classList.add('shoptet_buttons');
          form.prepend(buttons);

          for (command in commands) {
            let option = select.querySelector('option[value="' + command + '"]');
            if (option && commands[command].visible) {
              let button = document.createElement('a');
              button.setAttribute('href', '#');
              button.classList.add('shoptet_button');
              if (commands[command].highlighted) {
                button.classList.add('shoptet_button_' + commands[command].highlighted);
              }
              button.innerHTML = commands[command].label;
              buttons.append(button);
              (function(command) {
                button.addEventListener('click', (e) => {
                  e.preventDefault();
                  if (!button.classList.contains('shoptet_button_active')) {
                    button.classList.toggle('shoptet_button_active');
                    let options = select.querySelectorAll('option');
                    options.forEach(option => {
                      option.removeAttribute('selected');
                    });
                    option.setAttribute('selected', true);
                    let ev = new CustomEvent('change');
                    select.dispatchEvent(ev);

                    if (command === 'column' && typeof workboardColumnsSetUp === 'undefined') {
                      setTimeout(() => {
                        setupButtons(form.querySelector('optgroup[label="Workboards"').parentNode);
                        workboardColumnsSetUp = true;
                      }, 100);
                    }

                    if (command === 'priority' && typeof prioritiesSetUp === 'undefined') {
                      setTimeout(() => {
                        setupButtons(form.querySelector('option[value="unbreak"]').parentNode);
                        prioritiesSetUp = true;
                      }, 100);
                    }

                  }
                });
              })(command)
            }
          }

          const setupButtons = (el) => {
            if (el) {
              const buttons = document.createElement('div');
              buttons.classList.add('shoptet_buttons');
              form.querySelector('.shoptet_buttons').after(buttons);

              let options = el.querySelectorAll('option');
              options.forEach(option => {
                let button = document.createElement('a');
                button.setAttribute('href', '#');
                button.classList.add('shoptet_button');
                if (option.selected) {
                  button.classList.add('shoptet_button_active');
                }
                button.innerHTML = option.text;
                buttons.append(button);

                button.addEventListener('click', e => {
                  e.preventDefault();
                  options.forEach(option => {
                    option.removeAttribute('selected');
                  });
                  let currentButtons = buttons.querySelectorAll('.shoptet_button');
                  currentButtons.forEach(currentButton => {
                    currentButton.classList.remove('shoptet_button_active');
                  });
                  button.classList.add('shoptet_button_active');
                  option.setAttribute('selected', true);
                  let ev = new CustomEvent('change');
                  el.dispatchEvent(ev);
                });
              });
            }
          };

          let styleString = '.shoptet_buttons { display: flex; align-items: center; padding: 8px 16px 0; background-color: #fff;\n';
          styleString += 'flex-wrap: wrap; }\n';
          styleString += '.shoptet_buttons + .shoptet_buttons { border-top: 1px solid #bfcfda; }\n';
          styleString += 'a.shoptet_button { display: block; margin: 0 8px 8px 0; padding: 4px 8px; border: 1px solid #bfcfda;\n';
          styleString += 'border-radius: 3px; text-decoration: none; color: #136cb2; background-color: #eff3fc;}\n';
          styleString += 'a.shoptet_button:hover { text-decoration: none; background-color: #fff; }\n';
          styleString += 'a.shoptet_button.shoptet_button_active { font-weight: bold; box-shadow: 1px 1px 2px rgba(0,0,0,.5); }\n';
          styleString += 'a.shoptet_button.shoptet_button_red { border-color: #ce0004; background-color: #ff4b4e; color: #fff; }\n';
          styleString += 'a.shoptet_button.shoptet_button_green { border-color: #07ce00; background-color: #58ff28; color: #fff; }\n';
          styleString += 'a.shoptet_button.shoptet_button_blue { border-color: #0073ce; background-color: #28aaff; color: #fff; }\n';

          const style = document.createElement('style');
          style.innerHTML = styleString;
          document.getElementsByTagName('body')[0].prepend(style);

        }
      }
    }, 300);
  });

})();
