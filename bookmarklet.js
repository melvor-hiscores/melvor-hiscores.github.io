(function() {
    var MELVOR_SKILL_INDEX = {
        Woodcutting: 0,
        Fishing: 1,
        Firemaking: 2,
        Cooking: 3,
        Mining: 4,
        Smithing: 5,
        Attack: 6,
        Strength: 7,
        Defence: 8,
        Hitpoints: 9,
        Thieving: 10,
        Farming: 11,
        Ranged: 12,
        Fletching: 13,
        Crafting: 14,
        Runecrafting: 15,
        Magic: 16,
        Prayer: 17,
        Slayer: 18,
        Herblore: 19
    };

    var JADEDTDT_NUM_SKILLS = 21;

    var JADEDTDT_SKILL_INDEX = {
        Total: null,
        Attack: MELVOR_SKILL_INDEX.Attack,
        Strength: MELVOR_SKILL_INDEX.Strength,
        Defence: MELVOR_SKILL_INDEX.Defence,
        Hitpoints: MELVOR_SKILL_INDEX.Hitpoints,
        Ranged: MELVOR_SKILL_INDEX.Ranged,
        Magic: MELVOR_SKILL_INDEX.Magic,
        Prayer: MELVOR_SKILL_INDEX.Prayer,
        Slayer: MELVOR_SKILL_INDEX.Slayer,
        Woodcutting: MELVOR_SKILL_INDEX.Woodcutting,
        Fishing: MELVOR_SKILL_INDEX.Fishing,
        Firemaking: MELVOR_SKILL_INDEX.Firemaking,
        Cooking: MELVOR_SKILL_INDEX.Cooking,
        Mining: MELVOR_SKILL_INDEX.Mining,
        Smithing: MELVOR_SKILL_INDEX.Smithing,
        Thieving: MELVOR_SKILL_INDEX.Thieving,
        Farming: MELVOR_SKILL_INDEX.Farming,
        Fletching: MELVOR_SKILL_INDEX.Fletching,
        Crafting: MELVOR_SKILL_INDEX.Crafting,
        Runecrafting: MELVOR_SKILL_INDEX.Runecrafting,
        Herblore: MELVOR_SKILL_INDEX.Herblore
    };

    function extractGp() {
        dataJson = {};
        let totalGp = 0;

        // 1 - equipment value
        let equipmentValue = 0;
        for (let i = 0; i < equippedItems.length; i++) {
            /* special logic for ammo */
            if (i == CONSTANTS.equipmentSlot.Quiver) {
                equipmentValue += items[equippedItems[i]].sellsFor * ammo;
            } else {
                equipmentValue += items[equippedItems[i]].sellsFor * 1;
            }
        }
        totalGp += equipmentValue;

        // 2 - bank value
        let bankValue = 0;
        for (let i = 0; i < bank.length; i++) {
            bankValue += items[bank[i].id].sellsFor * bank[i].qty;
        }
        totalGp += bankValue;

        // 3 - current gp value
        totalGp += gp;

        // 4 - sold gp value
        totalGp += statsGeneral[0].count;

        /* final - merge into json */
        dataJson['gp'] = totalGp;

        return dataJson;
    }

    function extractSkills() {
        let dataJson = {};

        /* These are the JSON keys we are interested in */
        const KEYS = ['skillLevel', 'skillXP', 'username'];
        let reordered_skillLevel = new Array(JADEDTDT_NUM_SKILLS);
        let reordered_skillXP = new Array(JADEDTDT_NUM_SKILLS);

        /* Loop over the save file JSON keys */
        for (let i = 0; i < allVars.length; i++) {
            /* Reached a key we are interested in */
            if (KEYS.includes(allVars[i])) {
                /* Add to our JSON */
                if (allVars[i] == 'skillLevel') {
                    skillLevel = getItem(key + allVars[i]);

                    let j = 0;
                    for (let jKey in JADEDTDT_SKILL_INDEX) {
                        // Skipping index 0 because of total
                        if (j > 0) {
                            reordered_skillLevel[j] = skillLevel[MELVOR_SKILL_INDEX[jKey]];
                        }
                        j = j + 1;
                    }

                    // Setting total level
                    reordered_skillLevel[0] = reordered_skillLevel.reduce((a, b) => a + b, 0);

                    dataJson[allVars[i]] = reordered_skillLevel;
                } else if (allVars[i] == 'skillXP') {
                    skillXP = getItem(key + allVars[i]);

                    let j = 0;
                    for (let jKey in JADEDTDT_SKILL_INDEX) {
                        // Skipping index 0 because of total
                        if (j > 0) {
                            reordered_skillXP[j] = skillXP[MELVOR_SKILL_INDEX[jKey]];
                        }
                        j = j + 1;
                    }

                    // Setting total xp
                    reordered_skillXP[0] = reordered_skillXP.reduce((a, b) => a + b, 0);

                    dataJson[allVars[i]] = reordered_skillXP;
                } else if (allVars[i] == 'username') {
                    username = getItem(key + allVars[i]);

                    dataJson[allVars[i]] = username;
                }
            }
        }

        return dataJson;
    }

    function packageJson(gpJson, skillsJson) {

        combinedJson = {};

        for (let eachKey in gpJson) {
            combinedJson[eachKey] = gpJson[eachKey]
        }

        for (let eachKey in skillsJson) {
            combinedJson[eachKey] = skillsJson[eachKey]
        }

        console.log(combinedJson);

        /* gzip and B64 encode */
        const pakoSave = pako.gzip(JSON.stringify(combinedJson), { to: 'string' });
        return [ combinedJson['username'], btoa(pakoSave) ];
    }

    function sendToHiscoresAPI(username, b64JsonString) {
        $.ajax({
            url: 'https://l9ahyalvt7.execute-api.us-east-1.amazonaws.com/prod/users/' + username,
            type: 'POST',
            async: true,
            data: JSON.stringify({
                "data" : b64JsonString
            }),
            success: function(data) {
                console.log('Updated hiscores for user: ' + username);
            }
        });
    }

    // contributed by Toaxt - adds a notification once the scores are updated
    const updateNotify = () => {
        $.notify({
            message: '<img class="notification-img" src="assets/media/main/changelog_header.svg" height="32px"><span class="badge badge-success">HiScores data uploaded!</span>'
        }, {
            type: 'light',
            placement: {
                from: 'bottom',
                align: 'center'
            },
            delay: 1000,
            newest_on_top: true,
            animate: {
                enter: 'animated fadeInUp',
                exit: 'animated fadeOut'
            },
            template: '<div data-notify="container" class="col-12 col-md-2 text-center notify-event" role="alert"><span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>'
        });
    }

    function main() {
        let [ username, data ] = packageJson(extractGp(), extractSkills());
        sendToHiscoresAPI(username, data);
        updateNotify();
    }
    main();
}());
