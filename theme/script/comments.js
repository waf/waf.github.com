const githubIssueId = new URLSearchParams(document.currentScript.src.split('?')[1]).get('issue');
const githubApiURL = `https://api.github.com/repos/waf/waf.github.com/issues/${githubIssueId}/comments`;
const githubWebURL = `https://github.com/waf/waf.github.com/issues/${githubIssueId}`;

const commentHTML = `
    <div class="comment" id="{{id}}">
        <div class="comment-metadata">
            <img class="comment-avatar" src="{{user.avatar_url}}" alt="{{user.login}}'s avatar" />
            <a href="{{user.url}}">{{user.login}}</a>&nbsp;commented on&nbsp;<a href="#{{id}}">{{created_at}}</a>:
        </div>
        <div class="comment-content">{{body_html}}</div>
    </div>
`;
const leaveCommentHTML = `
    <div class="comment comment-ongithub"><a href="${githubWebURL}">Want to leave a comment? Post it on GitHub and it will appear here!</a></div>
`;

fetch(githubApiURL, {
    headers: {
        'Accept': 'application/vnd.github.squirrel-girl-preview', // for reactions
        'Accept': 'application/vnd.github.v3.html+json'
    }
})
.then(response => response.json())
.then(comments => {
    if(comments.message === "Not Found") {
        console.log("Could not find comments at " + githubWebURL);
        return;
    }
    var commentContainer = document.getElementById("comments");
    var commentContent = [];
    comments.forEach(comment => {
        var created = new Date(Date.parse(comment.created_at)); 
        var createdDate = created.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        var createdTime = created.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric' });
        commentContent.push(commentHTML
            .replaceAll("{{id}}", comment.id)
            .replaceAll("{{user.avatar_url}}", comment.user.avatar_url)
            .replaceAll("{{user.login}}", comment.user.login)
            .replaceAll("{{user.url}}", comment.user.html_url)
            .replaceAll("{{created_at}}", createdDate + " at " + createdTime)
            .replaceAll("{{body_html}}", comment.body_html)
        );
    });
    commentContainer.innerHTML = commentContent.join("") + leaveCommentHTML;
});
