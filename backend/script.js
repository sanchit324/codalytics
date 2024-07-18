const cors = require('cors');
const express = require('express')

const app = express()
const PORT = 3000

app.use(cors());

/****************************/
const fetchData = async (URL) => {
    try {
      const response = await fetch(URL);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
};


const processData = async (user) => {
    const profileURL = `https://codeforces.com/api/user.rating?handle=${user}`;
    try {
      const data = await fetchData(profileURL);
      const contestData = data.result;
  
      const ranks = contestData.map((contest) => contest.rank);
      const names = contestData.map((contest) => contest.contestName);
      const ratingChange = contestData.map((contest) => contest.newRating - contest.oldRating);
      const ratings = contestData.map((contest) => contest.newRating);

      const combinedLabels = names.map((name, index) => {
        const ratingChangeValue = ratingChange[index];
        return ratingChangeValue > 0 ? `+(${ratingChangeValue}) ${name}` : `(${ratingChangeValue}) ${name}`;
      });

      return { combinedLabels, ratings };
    } catch (error) {
      console.error('Error processing data:', error);
    }
};



const userStatus = async (user) => {
    const userStatusURL = `https://codeforces.com/api/user.status?handle=${user}`;
    try {
      const data = await fetchData(userStatusURL);
      const results = data.result;
      const problems = results.filter(res => res.verdict === "OK").map(res => res.problem);
      const unsolvedProblems = results
        .filter(res => res.verdict !== "OK")
        .map(res => res.problem)
        .filter(prob => prob.hasOwnProperty('rating'));
      const ratedProblems = problems.filter(prob => prob.hasOwnProperty('rating'));
  
      const uniqueProblemsMap = new Map();
      ratedProblems.forEach(prob => {
        const key = `${prob.contestId}-${prob.index}`; 
        if (!uniqueProblemsMap.has(key)) {
          uniqueProblemsMap.set(key, prob);
        }
      });
  
      const uniqueUnsolvedProblemsMap = new Map();
      const uniqueUnsolvedProblemsContestQuestionMap = new Map();
      unsolvedProblems.forEach(prob => {
        const key = `${prob.contestId}-${prob.index}`;
        if (!uniqueUnsolvedProblemsMap.has(key) && !uniqueProblemsMap.has(key)) {
          uniqueUnsolvedProblemsMap.set(key, prob);
          if (uniqueUnsolvedProblemsContestQuestionMap.has(prob.contestId)) {
            uniqueUnsolvedProblemsContestQuestionMap.get(prob.contestId).push(prob.index);
          } else {
            uniqueUnsolvedProblemsContestQuestionMap.set(prob.contestId, [prob.index]);
          }
        }
      });
  
      const unsolvedContestId = [];
      const unsolvedQuestionId = [];
  
      uniqueUnsolvedProblemsContestQuestionMap.forEach((indices, contestId) => {
        const len = indices.length;
        for (let i = 0; i < len; i++) unsolvedContestId.push(contestId);
        unsolvedQuestionId.push(...indices);
      });
  
      const unsolvedContestQuestion = Array.from(uniqueUnsolvedProblemsMap.keys());
  
      const uniqueProblems = Array.from(uniqueProblemsMap.values());
      const levels = uniqueProblems.map((prob) => prob.rating);
  
      const tagMap = new Map();
      const tags = uniqueProblems.map(prob => prob.tags);
  
      tags.forEach(tagArr => {
        tagArr.forEach(tagEle => {
          if (!tagMap.has(tagEle)) {
            tagMap.set(tagEle, 1);
          } else {
            tagMap.set(tagEle, tagMap.get(tagEle) + 1);
          }
        });
      });

      const countMap = levels.reduce((acc, value) => {
        acc[value] = acc[value] ? acc[value] + 1 : 1;
        return acc;
      }, {});

      const sortedEntries = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

      const tagKeysSorted = sortedEntries.map(entry => entry[0]);
      const tagValues = sortedEntries.map(entry => entry[1]);

      const tagKeys = tagKeysSorted.map((val,ind) => `${val}: ${tagValues[ind]}`)
  
      const labels = Object.keys(countMap);
      const counts = Object.values(countMap);
  
    return { countMap, sortedEntries, tagKeysSorted, tagValues, tagKeys, labels, counts, unsolvedQuestionId, unsolvedContestQuestion, unsolvedContestId };
    } catch (error) {
      console.log("Error processing user info data", error);
    }
};


app.get('/user/rating/:handle', async (req, res) => {
    const userHandle = req.params.handle;
    try {
      const data = await processData(userHandle);
      res.json(data);
    } catch (error) {
      res.status(500).send('Error fetching user rating data');
    }
});
  
app.get('/user/status/:handle', async (req, res) => {
const userHandle = req.params.handle;
try {
    const data = await userStatus(userHandle);
    res.json(data);
} catch (error) {
    res.status(500).send('Error fetching user status data');
}
});

app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});