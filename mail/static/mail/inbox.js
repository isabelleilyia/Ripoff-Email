
document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    
    // Attach send_email function to send button
    document.querySelector('#compose-form').addEventListener('submit', send_email); 
    
    // By default, load the inbox
    load_mailbox('inbox');
  });

  function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email_details').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  function load_mailbox(mailbox) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email_details').style.display = 'none';


    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    //request emails for mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);
        
        //sort emails
        const sortedEmails = emails.sort((a, b) => b.date - a.date)

        //create list item for each email and add to DOM
        var table = document.createElement("table");
        table.classList.add("table");
        document.querySelector('#emails-view').append(table);

        sortedEmails.forEach(function(email) {
            var row = document.createElement('tr');
            table.appendChild(row);
            if (email.read === false) {
                row.style.backgroundColor = "white";
                row.style.fontWeight = "bold";
            }
            else {
                row.style.backgroundColor = "#e3e3e3";
            }
            //adds event listener to the email row
            row.addEventListener('click', function () {
                display_email(email, mailbox);
            })
            
            var sender = document.createElement('td');
            sender.innerHTML = email.sender;
            row.appendChild(sender);

            var subject = document.createElement('td');
            subject.innerHTML = email.subject;
            row.appendChild(subject);

            var time = document.createElement('td');
            time.innerHTML = `<small> ${email.timestamp} </small>`;
            time.classList.add('text-muted')
            row.appendChild(time);
        
            }
        ) 
    });

    }

  function send_email() {
    //gets data from input fields
    const recipients = document.querySelector('#compose-recipients').value
    const subject = document.querySelector('#compose-subject').value
    const body = document.querySelector('#compose-body').value

    fetch('/emails', {
      method: "POST",
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    
    .then(result => {
        // Print result
        console.log(result);
    });
    
    
    // Load sent mailbox
    load_mailbox('sent');
    
    
  }

  function display_email (email, mailbox) {
    //loads email details view
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email_details').style.display = 'block';

    //get email info
    fetch(`/emails/${email.id}`)
    .then(response => response.json())
    .then(email => {
        // Print email
        console.log(email);
    

        //display info
        var view = document.querySelector("#email_details")
        view.innerHTML = "";

        var time = document.createElement('p');
        time.innerHTML = `<small>${email.timestamp}</small>`;
        time.classList.add("text-muted");
        time.style.float = "right";
        view.appendChild(time);

        

        var subject = document.createElement('h4');
        subject.innerHTML = email.subject;
        view.appendChild(subject);
        
        //checks if archived, displays proper button, handles archiving function
        if (mailbox != 'sent') {
            var archive = document.createElement('button');
            archive.classList.add("btn-outline-primary");
            archive.classList.add("btn-sm");
            archive.classList.add("btn");
            archive.classList.add("archive");
            
            if (email.archived === false) { 
                archive.innerHTML = "Archive";
                archive.onclick = function () {
                    fetch(`/emails/${email.id}`, {
                        method:'PUT',
                        body: JSON.stringify({
                            archived: true
                        })
                    });
                    load_mailbox('inbox');
                }
                
            }
            else {
                archive.innerHTML = "Unarchive";
                archive.onclick = function () {
                    fetch(`/emails/${email.id}`, {
                        method:'PUT',
                        body: JSON.stringify({
                            archived: false
                        })
                    })
                    load_mailbox('inbox');
                }
            }

            view.appendChild(archive);
        }
        //adds reply button and handles functionality
        var reply = document.createElement('button');
        reply.innerHTML = "Reply";
        reply.classList.add("btn-outline-primary");
        reply.classList.add("btn-sm");
        reply.classList.add("btn");
        reply.classList.add("reply");
        view.appendChild(reply);
        console.log(email);
        let s = email.sender;
        console.log(s)
        reply.onclick = function(s) {
            compose_email();
            document.querySelector('#compose-recipients').value = email.sender;
            if (email.subject.substring(0,3) === "Re:") {
                document.querySelector('#compose-subject').value = email.subject;
            }
            else {
                document.querySelector('#compose-subject').value = `Re:${email.subject}`;

            }
            document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n\t${email.body}\n`;

        }

        var sender = document.createElement('p');
        sender.innerHTML = `from: <span style="font-weight: normal;">
        ${email.sender} </span>`;
        sender.classList.add("sender");
        view.appendChild(sender);

        
        var recipients = document.createElement('p');
        recipients.innerHTML = `to: <span style="font-weight: normal;">
        ${email.recipients} </span>`;
        recipients.classList.add('sender');
        view.appendChild(recipients);

        var dash = document.createElement('hr');
        view.appendChild(dash)

        var body = document.createElement('p');
        body.innerHTML = email.body;
        view.appendChild(body);
        

    });

    //marks email as read
    fetch(`/emails/${email.id}`, {
        method:'PUT',
        body: JSON.stringify({
            read: true
        })
    })
}

