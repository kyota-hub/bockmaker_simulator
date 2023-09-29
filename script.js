document.addEventListener("DOMContentLoaded", function() {
  init();

  function init() {
    const betTypeSelect = document.getElementById("betType");
    const runSimulationButton = document.getElementById("runSimulationButton");

    betTypeSelect.addEventListener("change", toggleBetTypeFields);
    ["predictedAccuracy", "betAmount", "numGames"].forEach(id => {
        document.getElementById(id).addEventListener("input", updateRecommendedRewardMessage);
    });
    runSimulationButton.addEventListener("click", runSimulation);

    toggleBetTypeFields();
  }

  function toggleBetTypeFields() {
    const betTypeSelect = document.getElementById("betType");
    const betType = betTypeSelect.value;
    const multiOnlyElements = document.querySelectorAll(".multiOnly");

    document.getElementById("hitsHeader").style.display = betType === "multi" ? "" : "none";
    document.getElementById("resultHeader").style.display = betType === "single" ? "" : "none";

    const shouldDisplay = betType === "multi";
    setDisplayForElements(multiOnlyElements, shouldDisplay);

    // シミュレーションメッセージと結果テーブルを初期化
    clearSimulationMessage();
    document.getElementById("simulationResultsTable").style.display = "none";
    document.getElementById("simulationResults").innerHTML = "";

    // オッズの推薦メッセージを初期化
    document.getElementById("rewardRecommendation").textContent = "";
  }

  function setDisplayForElements(elements, shouldDisplay) {
    elements.forEach(el => el.style.display = shouldDisplay ? "" : "none");
  }

  function updateRecommendedRewardMessage() {
    const predictedAccuracy = getFloatValue("predictedAccuracy") / 100;
    const betAmount = getFloatValue("betAmount");
    const numGames = getBetType() === "multi" ? getFloatValue("numGames") : 1;

    const recommendedReward = betAmount / (Math.pow(predictedAccuracy, numGames));
    const recommendationMessage = `※資金増加が見込めるオッズは${(recommendedReward / betAmount).toFixed(2)}倍以上です`;
    document.getElementById("rewardRecommendation").textContent = recommendationMessage;
  }

  function getFloatValue(elementId) {
    return parseFloat(document.getElementById(elementId).value);
  }

  function getBetType() {
    return document.getElementById("betType").value;
  }

  function validateInputs() {
    const requiredFields = [
      "predictedAccuracy", "rewardPoints", "initialPoints", "betAmount", "simulationCount", "goalPoints"
    ];

    return requiredFields.every(fieldId => {
      const value = getFloatValue(fieldId);
      return !isNaN(value) && value >= 0;
    });
  }

  function runSimulation() {
    clearSimulationMessage();
    if (!validateInputs()) {
        alert("適切に値を入力してください");
        return;
    }
    document.getElementById("simulationResultsTable").style.display = "table";
    const simulationCount = getIntValue("simulationCount");
    const goalPoints = getFloatValue("goalPoints");
    const params = {
        betAmount: getFloatValue("betAmount"),
        rewardPoints: getFloatValue("rewardPoints"),
        predictedAccuracy: getFloatValue("predictedAccuracy") / 100,
        betType: getBetType(),
        numGames: getBetType() === "multi" ? getIntValue("numGames") : 1,
    };

    const simulationResultsTbody = document.getElementById("simulationResults");
    simulationResultsTbody.innerHTML = "";
    let currentPoints = getFloatValue("initialPoints");
    let counter = 0;

    for (let i = 0; i < simulationCount && currentPoints > 0 && currentPoints < goalPoints; i++) {
        currentPoints = simulateRound(currentPoints, params, simulationResultsTbody, i);
        counter++;
    }

    displayFinalSimulationMessage(currentPoints, counter, simulationCount);
  }

  function clearSimulationMessage() {
    document.getElementById("simulationMessage").textContent = "";
  }

  function getIntValue(elementId) {
    return parseInt(document.getElementById(elementId).value);
  }

  function simulateRound(initialPoints, params, tableBody, roundNum) {
    let currentPoints = initialPoints;
    let hits = 0;
    if (params.betType === "single") {
        ({ currentPoints, hits } = handleSingleBet(params, currentPoints));
    } else {
        ({ currentPoints, hits } = handleMultiBet(params, currentPoints));
    }
    appendSimulationResultToTable(tableBody, roundNum, hits, currentPoints - initialPoints, currentPoints, params.betType);
    return currentPoints;
  }

  function handleSingleBet(params, currentPoints) {
    let hits = 0;
    currentPoints -= params.betAmount;
    if (Math.random() < params.predictedAccuracy) {
        hits++;
        currentPoints += params.betAmount * params.rewardPoints;
    }
    return { currentPoints, hits };
  }

  function handleMultiBet(params, currentPoints) {
    currentPoints -= params.betAmount;  // ベット額を先に引く
    let hits = 0;
    // 各試合が的中するかを判定
    for (let i = 0; i < params.numGames; i++) {
        if (Math.random() < params.predictedAccuracy) {
            hits++;
        }
    }
    // 的中した試合の数に基づいて報酬を計算
    if (hits === params.numGames) {
        currentPoints += params.betAmount * (params.rewardPoints);  // すべての試合が的中した場合のみ報酬を受け取る
    }
    return { currentPoints, hits };
  }

  function appendSimulationResultToTable(tableBody, roundNum, hits, pointChange, currentPoints, betType) {
    const tr = document.createElement("tr");

    if (betType === "single") {
        const resultSymbol = hits === 1 ? "⚪︎" : "×";
        tr.innerHTML = `
            <td>${roundNum + 1}</td>
            <td>${resultSymbol}</td>
            <td>${pointChange.toFixed(2)}</td>
            <td>${currentPoints.toFixed(2)}</td>
        `;
    } else {
        tr.innerHTML = `
            <td>${roundNum + 1}</td>
            <td>${hits}</td>
            <td>${pointChange.toFixed(2)}</td>
            <td>${currentPoints.toFixed(2)}</td>
        `;
    }
    tableBody.appendChild(tr);
}

  function displayFinalSimulationMessage(currentPoints, counter, simulationCount) {
    const messageElement = document.getElementById("simulationMessage");
    if (currentPoints <= 0) {
        messageElement.textContent = "資金が枯渇しました";
    } else if (currentPoints >= getIntValue("goalPoints")) {
        messageElement.textContent = `${counter}回目で目標額に到達しました`;
    } else {
        messageElement.textContent = `${simulationCount}回実施して、現在の資金は${currentPoints.toFixed(2)}です`;
    }
  }
});
