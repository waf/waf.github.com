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

function loadComments() {
fetch(githubApiURL, {
    headers: {
        'Accept': 'application/vnd.github.squirrel-girl-preview', // for reactions
        'Accept': 'application/vnd.github.v3.html+json'
    }
})
.then(response => response.json())
.then(comments => {
    if(!Array.isArray(comments)) {
        // GitHub returned an error object instead of a list of comments.
        // Most commonly a 403 from the unauthenticated rate limit (60/hr per IP),
        // or a 404 ("Not Found") when the issue doesn't exist yet.
        console.log("Could not load comments from " + githubApiURL +
            (comments && comments.message ? ": " + comments.message : ""));
        var fallbackContainer = document.getElementById("comments");
        if (fallbackContainer) {
            fallbackContainer.innerHTML = leaveCommentHTML;
        }
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
}

// Only hit the GitHub API once the comments section actually scrolls into view,
// so a plain page load/refresh doesn't spend the (rate-limited) unauthenticated quota.
function observeComments() {
    var commentContainer = document.getElementById("comments");
    if (!commentContainer) {
        return;
    }
    if (!("IntersectionObserver" in window)) {
        loadComments(); // older browsers: just load eagerly
        return;
    }
    var observer = new IntersectionObserver(function(entries) {
        if (entries.some(entry => entry.isIntersecting)) {
            observer.disconnect();
            loadComments();
        }
    }, { rootMargin: "200px" }); // start loading a little before it's fully visible
    observer.observe(commentContainer);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeComments);
} else {
    observeComments();
}
