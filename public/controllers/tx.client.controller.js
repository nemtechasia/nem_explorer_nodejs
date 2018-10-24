angular
  .module('webapp')
  .controller('TXController', [
    '$scope',
    '$timeout',
    '$interval',
    '$location',
    'TXService',
    TXController,
  ]);
angular
  .module('webapp')
  .controller('SearchTXController', [
    '$scope',
    '$location',
    'TXService',
    SearchTXController,
  ]);
angular
  .module('webapp')
  .controller('UnconfirmedTXController', [
    '$scope',
    '$timeout',
    '$interval',
    '$location',
    'TXService',
    UnconfirmedTXController,
  ]);
angular
  .module('webapp')
  .controller('graphController', [
    '$scope',
    '$location',
    'TXService',
    graphController,
  ]);
angular
  .module('webapp')
  .controller('FeeCalculatorController', [
    '$scope',
    '$compile',
    'FooterService',
    FeeCalculatorController,
  ]);

function TXController($scope, $timeout, $interval, $location, TXService) {
  let type = '';
  let absUrl = $location.absUrl();
  let reg = /type=([a-z]+)/;
  if (absUrl && absUrl.match(reg) && absUrl.match(reg).length == 2) {
    type = absUrl.match(reg)[1];
  }
  $scope.page = 1;
  $scope.txList = [];
  $scope.txHashes = ',';
  $scope.fadeFlag = false;
  $scope.loadTXList = function() {
    TXService.txList({ page: $scope.page, type: type }, function(r_txList) {
      $scope.txHashes = ',';
      $scope.txList = r_txList;
      for (let i in $scope.txList) {
        $scope.txHashes += $scope.txList[i].hash + ',';
        $scope.txList[i] = $scope.handleTX($scope.txList[i]);
      }
      $scope.updateAge();
      $timeout(function() {
        $scope.fadeFlag = true;
      });
    });
  };
  $scope.addTX = function() {
    TXService.txList({ page: $scope.page, type: type }, function(r_txList) {
      for (let i = r_txList.length - 1; i >= 0; i--) {
        let tx = r_txList[i];
        let searchHash = ',' + tx.hash + ',';
        if ($scope.txHashes.indexOf(searchHash) != -1) continue;
        tx = $scope.handleTX(r_txList[i]);
        let removeTX = $scope.txList[9];
        let removeHash = ',' + removeTX.hash + ',';
        let addHash = ',' + tx.hash + ',';
        $scope.txHashes = $scope.txHashes.replace(removeHash, addHash);
        $scope.txList.splice(9, 1);
        $scope.txList.unshift(tx);
      }
      $scope.updateAge();
      $timeout(function() {
        $scope.fadeFlag = true;
      });
    });
  };
  // tx age
  $interval(function() {
    $scope.updateAge();
  }, 1000);
  $scope.updateAge = function() {
    let nowTime = new Date().getTime();
    for (let index in $scope.txList) {
      let tx = $scope.txList[index];
      tx.age = compareTime(nowTime, tx.time);
    }
  };
  $scope.nextPage = function() {
    $scope.page++;
    $scope.fadeFlag = false;
    $scope.loadTXList();
  };
  $scope.previousPage = function() {
    if ($scope.page > 1) {
      $scope.page--;
      $scope.fadeFlag = false;
      $scope.loadTXList();
    }
  };
  //load transaction detail
  $scope.showTx = function(index, $event) {
    $scope.selectedTXHash = $scope.txList[index].hash;
    //just skip the action when click from <a>
    if (
      $event != null &&
      $event.target != null &&
      $event.target.className.indexOf('noDetail') != -1
    ) {
      return;
    }
    $('#txDetail').modal('show');
    let hash = $scope.txList[index].hash;
    let height = $scope.txList[index].height;
    return showTransaction(height, hash, $scope, TXService);
  };
  $scope.loadTXList();

  // websocket - new block
  let sock = new SockJS('/ws/transaction');
  sock.onmessage = function(e) {
    if (!e || !e.data) return;
    $scope.addTX();
  };
  $scope.handleTX = function(tx) {
    if (!tx) return;
    tx.time = tx.timeStamp;
    tx.timeStamp = fmtDate(tx.timeStamp);
    tx.amount = fmtXEM(tx.amount);
    tx.fee = fmtXEM(tx.fee);
    tx.typeName = '';
    if (tx.type == 257) tx.typeName += 'transfer | ';
    if (tx.type == 2049) tx.typeName += 'importance | ';
    if (tx.type == 4097) tx.typeName += 'aggregate | ';
    if (tx.type == 4100) {
      tx.typeName += 'multisig | ';
      if (tx.aggregateFlag == 1) tx.typeName += 'aggregate | ';
    }
    if (tx.type == 8193) tx.typeName += 'namespace | ';
    if (tx.type == 16385 || tx.type == 16386 || tx.mosaicTransferFlag == 1)
      tx.typeName += 'mosaic | ';
    if (tx.apostilleFlag == 1) tx.typeName += 'apostille | ';
    if (tx.typeName != '' && tx.typeName.length >= 2)
      tx.typeName = tx.typeName.substring(0, tx.typeName.length - 3);
    return tx;
  };
}

function graphController($scope, $location, TXService) {
  let type = '';
  $scope.gxList = [];
  let absUrl = $location.absUrl();
  $scope.graphTx = function() {
    var countNum = 0;

    TXService.reportTx({ page: $scope.page, type: type }, function(r_txList) {
      $scope.gxList = r_txList;
      var startDate = new Date(new Date().setHours(0, 0, 0, 0)); //YYYY-MM-DD
      startDate.setDate(startDate.getDate() - 10);
      var endDate = new Date(new Date().setHours(0, 0, 0, 0)); //YYYY-MM-DD
      endDate.setDate(endDate.getDate() - 1);

      var getDateArray = function(start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {
          arr.push(new Date(dt));
          dt.setDate(dt.getDate() + 1);
        }
        return arr;
      };

      var dateArr = getDateArray(startDate, endDate);

      var ctx = document.getElementById('myChart');
      var myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [
            dateArr[0].toLocaleDateString(),
            dateArr[1].toLocaleDateString(),
            dateArr[2].toLocaleDateString(),
            dateArr[3].toLocaleDateString(),
            dateArr[4].toLocaleDateString(),
            dateArr[5].toLocaleDateString(),
            dateArr[6].toLocaleDateString(),
            dateArr[7].toLocaleDateString(),
            dateArr[8].toLocaleDateString(),
            dateArr[9].toLocaleDateString(),
          ],
          datasets: [
            {
              label: 'Total transaction ',
              data: [
                $scope.gxList[9],
                $scope.gxList[8],
                $scope.gxList[7],
                $scope.gxList[6],
                $scope.gxList[5],
                $scope.gxList[4],
                $scope.gxList[3],
                $scope.gxList[2],
                $scope.gxList[1],
                $scope.gxList[0],
              ],
              borderColor: '#3e95cd',
              fill: false,
            },
          ],
        },
        options: {
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
        },
      });
    });
  };
}

function FeeCalculatorController($scope, $compile, FooterService) {
  $('#mosaic').hide();
  $scope.amount = '0';
  $scope.multiplier = '1';
  $scope.fee = '0.050000' * $scope.multiplier;
  $scope.message = '';
  $scope.dur = '1';
  $scope.rates = {};

  const currentFeeFactor = 0.05;

  $scope.messageOptions = [
    {
      label: 'Unencrypted',
      value: '1024',
    },
    {
      label: 'Encrypted',
      value: '976',
    },
    {
      label: 'Hexadecimal',
      value: '2048',
    },
  ];

  $scope.durationOptions = [
    {
      label: 'Day',
      value: '1',
    },
    {
      label: 'Month',
      value: '30',
    },
    {
      label: 'Year',
      value: '365',
    },
  ];

  $scope.currencyList = [
    'USD',
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CNY',
    'CZK',
    'DKK',
    'EUR',
    'GBP',
    'HKD',
    'HUF',
    'IDR',
    'ILS',
    'INR',
    'JPY',
    'KRW',
    'MXN',
    'MYR',
    'NOK',
    'NZD',
    'PHP',
    'PLN',
    'RUB',
    'SEK',
    'SGD',
    'THB',
    'TRY',
    'ZAR',
  ];

  $scope.messageType = $scope.messageOptions[0];
  $scope.timePeriodType = $scope.durationOptions[0];
  $scope.currency = $scope.currencyList[0];

  FooterService.market(function(r_market) {
    if (!r_market || !r_market.btc || !r_market.usd || !r_market.cap) return;
    $scope.price = r_market.usd;
    $scope.feeFiat = ($scope.price * $scope.fee).toFixed(4);
  });

  $scope.mosaicTransfer = function() {
    var MosaicTransferCheck = document.getElementById('checkbox');

    if (MosaicTransferCheck.checked == true) {
      $('#amount').hide();
      $('#xemAmountDiv').hide();
      $('#mosaic').show();
      $scope.amount = '0';
      if ($scope.message.length == 0) {
        $scope.fee = (0.0).toFixed(6);
        $scope.feeFiat = $scope.feeConvertor(
          ($scope.price * $scope.fee).toFixed(4)
        );
      } else {
        $scope.fee = (
          $scope.feeMessage *
          ($scope.dur * $scope.timePeriodType.value) *
          $scope.multiplier
        ).toFixed(6);
        $scope.feeFiat = $scope.feeConvertor(
          ($scope.price * $scope.fee).toFixed(4)
        );
      }
    } else {
      $('#amount').show();
      $('#xemAmountDiv').show();
      $('#mosaic').hide();
      $scope.mosaicAmount = '0';
      if ($scope.message.length == 0) {
        $scope.fee = (
          0.05 *
          timePeriodType.value($scope.dur * $scope.timePeriodType.value) *
          $scope.multiplier
        ).toFixed(6);
        $scope.feeFiat = $scope.feeConvertor(
          ($scope.price * $scope.fee).toFixed(4)
        );
      } else {
        let fees = $scope.feeMessage + 0.05;
        $scope.fee = (
          fees *
          ($scope.dur * $scope.timePeriodType.value) *
          $scope.multiplier
        ).toFixed(6);
        $scope.feeFiat = $scope.feeConvertor(
          ($scope.price * $scope.fee).toFixed(4)
        );
      }
    }
  };

  $scope.handle = function() {
    // $scope.calTotalMosaic();

    let amount = new Number($scope.amount.replace(/\s+/, '').replace(/,/g, ''));
    let dur = new Number($scope.dur.replace(/\s+/, '').replace(/,/g, ''));
    let message = new String($scope.message);
    var MosaicTransferCheck = document.getElementById('checkbox');

    var textarea = document.getElementById('textarea');

    if ($scope.messageType.value == 2048) {
      var reg = /[^0-9a-fA-F]/;
      if (reg.test(textarea.value) == true) {
        textarea.style.border = '1px solid red';
        textarea.style.color = 'red';
      } else {
        textarea.style.border = '0';
        textarea.style.borderBottom = '2px solid #1779ba';
        textarea.style.color = '#1779ba';
      }
    } else {
      textarea.style.border = '0';
      textarea.style.borderBottom = '2px solid #1779ba';
      textarea.style.color = '#1779ba';
    }

    if (MosaicTransferCheck.checked == true) {
      let feeMessage = $scope.calculateMessage(message);
      $scope.feeMessage = feeMessage;
      let feeMosaic = $scope.calTotalMosaic();
      $scope.total = feeMessage + feeMosaic;
      $scope.fee = (
        $scope.total *
        (dur * $scope.timePeriodType.value) *
        $scope.multiplier
      ).toFixed(6);
      $scope.feeFiat = $scope.feeConvertor(
        ($scope.price * $scope.fee).toFixed(4)
      );
      return;
    } else {
      let feeMessage = $scope.calculateMessage(message);
      $scope.feeMessage = feeMessage;
      let feeAmount = $scope.calculateMinimum(amount);
      $scope.total = feeMessage + feeAmount;
      $scope.fee = (
        $scope.total *
        (dur * $scope.timePeriodType.value) *
        $scope.multiplier
      ).toFixed(6);
      $scope.feeFiat = $scope.feeConvertor(
        ($scope.price * $scope.fee).toFixed(4)
      );
      return;
    }
  };

  $scope.calculateMessage = function(message) {
    let length;

    if (!message.length) return 0.0;
    if ($scope.messageType.value == 2048) {
      length = (message.length + 2) / 2;
    } else if ($scope.messageType.value == 1024) {
      length = message.length;
    } else if ($scope.messageType.value == 976) {
      length = 32 + 16 + Math.ceil(message.length / 16) * 16;
    }

    $scope.message = message;
    return currentFeeFactor * (Math.floor(length / 32) + 1);
  };

  $scope.feeConvertor = amount => {
    FooterService.rates(function(rates) {
      $scope.rates = rates;
    });

    $scope.currency !== ''
      ? $scope.currency
      : ($scope.currency = $scope.currencyList[0]);

    return ($scope.rates[$scope.currency] * amount).toFixed(4);
  };

  $scope.calculateMosaics = function(quantity, supply, divisibility) {
    let totalFee = 0;
    let fee = 0;
    let supplyRelatedAdjustment = 0;

    if (supply == 0 || divisibility == 0) {
      return 0.0;
    }

    if (supply <= 10000 && divisibility === 0) {
      // Small business mosaic fee
      fee = currentFeeFactor;
    } else {
      let maxMosaicQuantity = 9000000000000000;
      let totalMosaicQuantity = supply * Math.pow(10, divisibility);
      supplyRelatedAdjustment = Math.floor(
        0.8 * Math.log(Math.floor(maxMosaicQuantity / totalMosaicQuantity))
      );
      //let numNem = calculateXemEquivalent(quantity, supply, divisibility);
      // Using Math.ceil below because xem equivalent returned is sometimes a bit lower than it should
      // Ex: 150'000 of nem:xem gives 149999.99999999997
      //fee = calculateMinimum(Math.ceil(numNem));
      fee = $scope.calculateXemEquivalent(quantity, supply, divisibility);
    }
    totalFee = currentFeeFactor * Math.max(1, fee - supplyRelatedAdjustment);

    return totalFee;
  };

  $scope.calTotalMosaic = () => {
    let totalFees = 0;

    for (let i = 0; i < $('#mosaicSection').children().length; i++) {
      let id = $('#mosaicSection').children()[i].id;

      let mosaicFieldId = id.split('_')[1];

      let mosaicAmount = $scope['mosaicAmount_' + mosaicFieldId];
      let mosaicSupply = $scope['mosaicSupply_' + mosaicFieldId];
      let mosaicDiv = $scope['mosaicDiv_' + mosaicFieldId];

      totalFees += $scope.calculateMosaics(
        mosaicAmount,
        mosaicSupply,
        mosaicDiv
      );
    }
    console.log(totalFees);
    return totalFees;
  };

  $scope.calculateMinimum = function(numNem) {
    let fee = currentFeeFactor * Math.floor(Math.max(1, numNem / 10000));
    return fee > 1.25 ? 1.25 : fee;
  };

  $scope.calculateXemEquivalent = function(quantity, supply, divisibility) {
    if (supply === 0) {
      return 0;
    }

    return Math.min(25, (quantity * 900000) / supply);
  };

  $scope.addMosaicSec = () => {
    let totalMosaicSec = $('#mosaicSection').children().length + 1;
    let lastMosaicSec = $('#mosaicSection div:last')
      .attr('id')
      .split('_')[1];

    let mosaicSecCounter = parseInt(lastMosaicSec) + 1;

    let mosaci_template =
      `<div id=mosaic_` +
      mosaicSecCounter +
      ` style="
      border: black;
      border-style: double;
      margin-bottom: 5px;
      padding: 5px;
  ">` +
      `<label id="mosaicAmount">Mosaic Quantity
		<input class="box-input" type="text" ng-model="mosaicAmount_` +
      mosaicSecCounter +
      `" ng-keyup="handle()" style="width:100%; margin-left:4px; margin-right:4px; padding-left:4px;" />
	</label>
	<label id="mosaicSuply">Mosaic Supply
		<input class="box-input" type="text" ng-model="mosaicSupply_` +
      mosaicSecCounter +
      `" ng-keyup="handle()" style="width:100%; margin-left:4px; margin-right:4px; padding-left:4px;" />
	</label>
	<label id="mosaiDiv">Divisibility
		<input class="box-input" type="text" ng-model="mosaicDiv_` +
      mosaicSecCounter +
      `" ng-keyup="handle()" style="width:100%; margin-left:4px; margin-right:4px; padding-left:4px;" />
	</label>
	<button type="button" class="btn-danger btn btn-md" ng-click="removeMosaicSec(` +
      mosaicSecCounter +
      `)">
		<i>-</i> Click to Remove Mosaic
	</button>
</div>`;

    if (totalMosaicSec <= 10) {
      $compile($('#mosaicSection').append(mosaci_template))($scope);
    }
  };

  $scope.removeMosaicSec = id => {
    $('#mosaic_' + id).remove();
  };

  $scope.handle();
}

function SearchTXController($scope, $location, TXService) {
  var absUrl = $location.absUrl();
  if (absUrl == null) {
    return;
  }
  var reg = /hash=(\w{64})/;
  if (absUrl.match(reg).length == 2) {
    var hash = absUrl.match(reg)[1];
    showTransaction(null, hash, $scope, TXService);
  }
}

function UnconfirmedTXController(
  $scope,
  $timeout,
  $interval,
  $location,
  TXService
) {
  $scope.txList = [];
  $scope.fadeFlag = false;
  $scope.loadUnconfirmedTXList = function() {
    TXService.unconfirmedTXList(function(r_txList) {
      $scope.txList = r_txList;
      for (let i in $scope.txList)
        $scope.txList[i] = $scope.handleTX($scope.txList[i]);
      $scope.updateAge();
      $timeout(function() {
        $scope.fadeFlag = true;
      });
    });
  };
  // tx age
  $interval(function() {
    $scope.updateAge();
  }, 1000);
  $scope.updateAge = function() {
    let nowTime = new Date().getTime();
    for (let index in $scope.txList) {
      let tx = $scope.txList[index];
      tx.age = compareTime(nowTime, tx.time);
    }
  };
  //load unconfirmed transaction detail
  $scope.showUnconfirmedTx = function(index, $event) {
    $scope.selectedTXSign = $scope.txList[index].signature;
    //just skip the action when click from <a>
    if (
      $event != null &&
      $event.target != null &&
      $event.target.className.indexOf('noDetail') != -1
    ) {
      return;
    }
    $('#txDetail').modal('show');
    return showUnconfirmedTransaction($scope.txList[index], $scope);
  };
  $scope.loadUnconfirmedTXList();
  // websocket - unconfirmed transactions
  let sock = new SockJS('/ws/unconfirmed');
  sock.onmessage = function(e) {
    if (!e || !e.data) return;
    let data = JSON.parse(e.data);
    if (!data || !data.action) return;
    if (data.action == 'add') {
      //add new unconfirmed transaction
      let tx = $scope.handleTX(data.content);
      $scope.txList.unshift(tx);
    } else if (data.action == 'remove') {
      let signature = data.content.signature;
      let newTxList = [];
      for (let i in $scope.txList) {
        let item = $scope.txList[i];
        if (item && item.signature && item.signature != signature)
          newTxList.push(item);
      }
      $scope.txList = newTxList;
    } else if (data.action == 'update') {
      let tx = data.content;
      for (let i in $scope.txList) {
        let item = $scope.txList[i];
        if (item && item.signature && item.signature == tx.signature) {
          let tx = $scope.handleTX(data.content);
          $scope.txList[i] = tx;
        }
      }
    } else if (data.action == 'expired') {
      let newTxList = [];
      let nowTime = new Data().getTime();
      for (let i in $scope.txList) {
        let item = $scope.txList[i];
        if (!item) continue;
        let deadline =
          item.deadline * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0);
        if (nowTime <= deadline) newTxList.push(item);
      }
      $scope.txList = newTxList;
    }
    $scope.$apply();
  };
  $scope.handleTX = function(tx) {
    if (!tx) return;
    tx.time = tx.timeStamp;
    tx.timeStamp = fmtDate(tx.timeStamp);
    tx.deadline = fmtDate(tx.deadline);
    tx.amount = isNaN(tx.amount) ? 0 : fmtXEM(tx.amount);
    tx.fee = fmtXEM(tx.fee);
    tx.typeName = '';
    if (tx.type == 257) tx.typeName += 'transfer | ';
    if (tx.type == 2049) tx.typeName += 'importance | ';
    if (tx.type == 4097) tx.typeName += 'aggregate | ';
    if (tx.type == 8193) tx.typeName += 'namespace | ';
    if (tx.type == 16385 || tx.type == 16386 || tx.mosaicTransferFlag == 1)
      tx.typeName += 'mosaic | ';
    if (tx.apostilleFlag == 1) tx.typeName += 'apostille | ';
    if (tx.aggregateFlag == 1) tx.typeName += 'aggregate | ';
    if (tx.type == 4100) {
      tx.typeName += 'multisig | ';
      if (tx.otherTrans.type == 4097) tx.typeName += 'aggregate | ';
      tx.amount = tx.otherTrans.amount ? fmtXEM(tx.otherTrans.amount) : 0;
      tx.fee = tx.otherTrans.fee ? fmtXEM(tx.otherTrans.fee) : 0;
      tx.sender = tx.otherTrans.sender;
      tx.recipient = tx.otherTrans.recipient;
      tx.typeName = tx.typeName.replace(
        'multisig',
        'multisig (' + tx.signed.length + '/' + tx.minSigned + ')'
      );
    }
    if (tx.typeName != '' && tx.typeName.length >= 2)
      tx.typeName = tx.typeName.substring(0, tx.typeName.length - 3);
    return tx;
  };
}
