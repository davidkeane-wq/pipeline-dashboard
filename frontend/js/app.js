const API_BASE = window.location.origin;

function badge(value) {
  if (!value) return '<span class="badge badge-default">—</span>';
  const cls = ["success","failure","cancelled","skipped","in_progress","queued"].includes(value)
    ? `badge-${value}` : "badge-default";
  return `<span class="badge ${cls}">${value.replace(/_/g, " ")}</span>`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

async function fetchRuns() {
  const owner = document.getElementById("owner").value.trim();
  const repo  = document.getElementById("repo").value.trim();
  const msg   = document.getElementById("message");
  const table = document.getElementById("runsTable");
  const tbody = document.getElementById("runsBody");
  const btn   = document.getElementById("fetchBtn");
  const spin  = document.getElementById("spinner");

  if (!owner || !repo) {
    msg.className = "error";
    msg.textContent = "Please enter both an owner and a repository name.";
    return;
  }

  msg.className = "";
  msg.textContent = "";
  table.style.display = "none";
  tbody.innerHTML = "";
  btn.disabled = true;
  spin.style.display = "inline-block";

  try {
    const res = await fetch(`${API_BASE}/api/pipelines/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();

    if (data.runs.length === 0) {
      msg.textContent = `No workflow runs found for ${owner}/${repo}.`;
      return;
    }

    msg.textContent = `Showing ${data.runs.length} of ${data.total_count} runs for ${owner}/${repo}.`;

    data.runs.forEach(run => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a href="${run.html_url}" target="_blank" rel="noopener">${run.name}</a></td>
        <td>${badge(run.status)}</td>
        <td>${badge(run.conclusion)}</td>
        <td><code>${run.branch}</code></td>
        <td>${run.event}</td>
        <td>${fmtDate(run.created_at)}</td>
      `;
      tbody.appendChild(tr);
    });

    table.style.display = "table";
  } catch (e) {
    msg.className = "error";
    msg.textContent = `Error: ${e.message}`;
  } finally {
    btn.disabled = false;
    spin.style.display = "none";
  }
}

// Allow pressing Enter from either input
["owner","repo"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") fetchRuns();
  });
});
