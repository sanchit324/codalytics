import { Chart } from "chart.js/auto";
import { useState, useEffect, useRef } from "react";
import { BarChart } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { DoughnutChart } from "./components/DoughnutChart";
import chroma from "chroma-js";
import './App.css'; 
import axios from 'axios'
import { useQuery, gql } from '@apollo/client';


const USER_RATING_QUERY = gql`
  query UserRating($handle: String!) {
    processedUserRating(handle: $handle) {
      combinedLabels
      ratings
    }
  }
`;

const USER_STATUS_QUERY = gql`
  query UserStatus($handle: String!) {
    processedUserStatus(handle: $handle) {
      countMap
      counts
      labels
      sortedEntries
      tagKeys
      tagKeysSorted
      tagValues
      unsolvedContestId
      unsolvedContestQuestion
      unsolvedQuestionId
    }
  }
`;

function App() {
  const [chartData, setChartData] = useState({
    labels: [], 
    datasets: [
      {
        label: "Ranks",
        data: [], 
        backgroundColor: [],
        borderColor: "black",
        borderWidth: 0
      },
      {
        label: "Ratings",
        data: [],
        backgroundColor: [],
        borderColor: "black",
        borderWidth: 0.5
      },
    ]
  });
  const [problemLevel, setProblemLevel] = useState({
    labels: [],
    datasets: [
      {
        label: "Problems Solved",
        data: [],
        backgroundColor: [],
        borderColor: "black",
        borderWidth: 0
      }
    ]
  });
  const [problemTags, setProblemTags] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: "black",
      borderWidth: 0
    }]
  });
  const [unsolvedProblems, setUnsolvedProblems] = useState([]);
  const [uniqueUnsolvedProblems, setUniqueUnsolvedProblems] = useState([]);
  const [username, setUsername] = useState('sanchitsingla1120');

  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  const handleButtonClick = () => {
    const inputValue = inputRef.current.value;
    setUsername(inputValue);
  };
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      buttonRef.current.classList.add('active');
      handleButtonClick();
      setTimeout(() => {
        buttonRef.current.classList.remove('active');
      }, 300);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener('keypress', handleKeyPress);
    }
    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('keypress', handleKeyPress);
      }
    };
  }, []);

  const ratingColors = (lab) => {
    if(lab < 1200) return '#CCCCCC';
    else if(lab < 1400) return '#76FF77';
    else if(lab < 1600) return '#76DDBB';
    else if(lab < 1900) return '#AAAAFF';
    else if(lab < 2100) return '#FF88FF';
    else if(lab < 2300) return '#FFCC87';
    else if(lab < 2400) return '#FFBB55';
    else if(lab < 2600) return '#FF7777';
    else if(lab < 3000) return '#FF3233';
    else return '#AA0101';
  };

  const getURL = (contest, question) => {
    return `https://codeforces.com/problemset/problem/${contest}/${question}`
  }
  const fetchDataAndSetChartData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/user/rating/${username}`);
      const { combinedLabels, ratings } = response.data;
      setChartData(prevChartData => ({
        ...prevChartData,
        labels: combinedLabels,
        datasets: [
          {
            ...prevChartData.datasets[1],
            data: ratings,
            backgroundColor: ratings.map(ratingColors),
            label: "Rating", 
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching or setting chart data:', error);
    }
  };

  const fetchLevelData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/user/status/${username}`)
      const { tagValues, tagKeys, labels, counts, unsolvedQuestionId, unsolvedContestQuestion, unsolvedContestId } = response.data;
      const tagColors = chroma.scale(['#FFBB55','#CCCCCC', '#AA0101','#FF88FF','#76FF77', '#76DDBB', '#AAAAFF','#FFCC87','#FF7777', '#FF3233']).mode('rgb').colors(tagValues.length)

      setProblemLevel(problemLevel => ({
        ...problemLevel,
        labels: labels,
        datasets: [
          {
            ...problemLevel.datasets[0],
            data: counts,
            backgroundColor: labels.map(ratingColors),
            borderColor: "black",
            borderWidth: 1,
          }
        ]
      }));
      setProblemTags(problemTags => ({
        ...problemTags,
        labels: tagKeys,
        datasets: [{
          ...problemTags.datasets[0],
          data: tagValues,
          backgroundColor: tagColors,
          borderWidth:0.5,
          borderColor: 'white'
        }]
      }));

      const unsolvedQuestionURL = unsolvedContestId.map((ques,idx) => getURL(ques,unsolvedQuestionId[idx]));
      setUnsolvedProblems(unsolvedQuestionURL);
      setUniqueUnsolvedProblems(unsolvedContestQuestion);

    } catch (error) {
      console.log("Error in getting the values", error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchDataAndSetChartData();
      fetchLevelData();
    }
  }, [username]);


  return (
    <div className="App">
      <h1 className="heading">Welcome <span>{username}</span> to Codeforces Analytics 🚀</h1>
      <div className="input-container">
            <input 
                type="text" 
                ref={inputRef}
                placeholder="Enter your username"
                defaultValue={username}
                onKeyPress={handleKeyPress}
                className="username-input"
                id = {username}
            />
            <button ref={buttonRef} onClick={handleButtonClick} className="submit-button">
                Enter
            </button>
        </div>
      <div className="problem-level-box">
        <h2>Problems Solved</h2>
        <BarChart chartData={problemLevel}/>
      </div>
      <div className="problem-tag-box">
        <h2>Problem Tags</h2>
        <DoughnutChart chartData={problemTags}/>
      </div>
      <div className="rating-box">
        <h2>Contest Ratings</h2>
        <LineChart chartData={chartData}/>
      </div>
      <div className="unsolved-questions-box">
        <h2>Unsolved Questions: {uniqueUnsolvedProblems.length}</h2>
        <div>
          {unsolvedProblems.length > 0 ? (
            <p className="unsolved-questions-list">
              {unsolvedProblems.map((url, index) => (
                <span key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{uniqueUnsolvedProblems[index]}</a>
                  {index < unsolvedProblems.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          ) : (
            <p>No unsolved questions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default App;
