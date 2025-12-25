// TODO
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';

// GitHub: owner/repo
const repoList = ['vuejs/core', 'vueuse/vueuse'];

const defaultSaveTo = fileURLToPath(
  new URL('../data/repos.json', import.meta.url),
);

async function reqRepoData(endPoint) {
  const { data } = await axios.get(`https://api.github.com/repos/${endPoint}`, {
    headers: {
      Accept: 'application/vnd.github.v4+json',
    },
  });

  return {
    timestamp: Date.now(),
    key: endPoint,
    avatar_url: data?.owner.avatar_url,
    html_url: data.html_url,
    description: data.description,
    language: data.language,
    stargazers_count: data.stargazers_count,
    forks_count: data.forks_count,
    pushed_at: data.pushed_at,
  };
}

function main(endPoints, saveTo) {
  const dir = path.dirname(saveTo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const oldData = fs.existsSync(saveTo)
    ? JSON.parse(fs.readFileSync(saveTo, 'utf-8'))
    : {};
  const newData = endPoints.reduce((acc, endPoint) => {
    acc[endPoint] = oldData[endPoint] || {};
    return acc;
  }, {});

  Promise.allSettled(endPoints.map(reqRepoData))
    .then(items => {
      items.forEach(res => {
        if (res.status === 'fulfilled') {
          const { key, ...rest } = res.value;
          newData[key] = rest;
        }
      });
      fs.writeFileSync(saveTo, JSON.stringify(newData, undefined, 2));
    })
    .catch(e => {
      console.error('Error fetching GitHub repository data:', e);
      process.exit(1);
    });
}

main(repoList, defaultSaveTo);
