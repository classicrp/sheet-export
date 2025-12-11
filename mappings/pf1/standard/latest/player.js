import baseMapping from "../../../../scripts/baseMapping.js";

class MappingClass extends baseMapping {


    authors = [
        {
            name: 'gioppoluca',
            url: 'https://github.com/gioppoluca',
            github: 'https://github.com/gioppoluca',
        },
        {
            name: 'raydenx, classicrp',
            url: 'https://github.com/classicrp',
            github: 'https://github.com/classicrp',
        },
    ];
    // override createMappings method from base class
    async createMappings() {
        super.createMappings();

        // Set the PDF files to use - MIND that the order of the files is important!
        await this.pdfFiles.push({
            pdfUrl: '/modules/sheet-export/mappings/pf1/Pf1e-Foundry_to_PDF.pdf',
            nameDownload: `${this.actor.name ?? "character"}.pdf`,
            name: "Pf1e-Foundry_to_PDF.pdf",
        });

		var filtered = "", rslt = "", attStat = "", attMod = "", dmgStat = "", dmgMod = "", srcs = "";
		var mythicTier = 0;

//	BEGIN CHARACTER ID
        await this.setCalculated("Player", Object.entries(this.actor.permission).filter(entry => entry[1] === 3).map(entry => entry[0]).map(id => !game.users.get(id)?.isGM ? game.users.get(id)?.name : null).filter(x => x).join(", "));
        await this.setCalculated("Character Name", this.actor.name);
//	END CHARACTER ID

//	BEGIN ABILITIES
		srcs = this.actor.system.abilities;
        await this.setCalculated("Ability Score Strength", srcs.str.total);
        await this.setCalculated("Ability Score Dexterity", srcs.dex.total);
        await this.setCalculated("Ability Score Constitution", srcs.con.total);
        await this.setCalculated("Ability Score Intelligence", srcs.int.total);
        await this.setCalculated("Ability Score Wisdom", srcs.wis.total);
        await this.setCalculated("Ability Score Charisma", srcs.cha.total);
        await this.setCalculated("Ability Modifier Strength", srcs.str.mod);
        await this.setCalculated("Ability Modifier Dexterity", srcs.dex.mod);
        await this.setCalculated("Ability Modifier Constitution", srcs.con.mod);
        await this.setCalculated("Ability Modifier Intelligence", srcs.int.mod);
        await this.setCalculated("Ability Modifier Wisdom", srcs.wis.mod);
        await this.setCalculated("Ability Modifier Charisma", srcs.cha.mod);
	//	missing and of little use?
		//		Temp Adjustment {'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'}
		//		Temp Mod {'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'}
// 	END ABILITIES

//	BEGIN DETAILS
		srcs = this.actor.system.details.alignment;
		rslt = pf1.config.alignmentsShort[srcs];
		await this.setCalculated("Alignment", rslt || "");

		filtered = await this.actor._itemTypes.class;
        await this.setCalculated("Class", filtered[0].name);
        await this.setCalculated("Level", filtered[0].system.level);
		if (filtered.length > 1) {
			await this.setCalculated("Class1", filtered[1].name);
			await this.setCalculated("Level1", filtered[1].system.level);
		} else {
			await this.setCalculated("Class1", "");
			await this.setCalculated("Level1", "");
		}
		filtered = "";
        await this.setCalculated("Deity", this.actor.system.details.deity);
        await this.setCalculated("Race", this.actor.items.filter(i => i.type === "race").map(i => i.name)[0]);
        await this.setCalculated("Size", this.actor.system.traits.size.base);
        await this.setCalculated("Gender", this.actor.system.details.gender);
        await this.setCalculated("Age", this.actor.system.details.age);
        await this.setCalculated("Height", this.actor.system.details.height);
        await this.setCalculated("Weight", this.actor.system.details.weight);
//	END DETAILS

//	START CHARACTER HEALTH
	//	Set Wounds and Vigor regardless of system used
		rslt = this.actor.system.attributes.vigor.max;
		temp = `V${rslt}`;
        await this.setCalculated("Total Vigor", rslt || "");
		rslt = this.actor.system.attributes.wounds.max;
		temp += ` W(${rslt})`;
        await this.setCalculated("Total Wounds", rslt || "");
		if (game.settings.get("pf1", "healthConfig").pc.rules.useWoundsAndVigor) {
		//	Using the Wounds and Vigor option instead of HP
			rslt = temp;
		} else {
			rslt = this.actor.system.attributes.hp.max;
		}
        await this.setCalculated("Total Hp", rslt || "");
//	END CHARACTER HEALTH

//	BEGIN SAVING THROWS
		filtered = await this.actor._itemTypes.class;
		var ifort = 0, iref = 0, iwill = 0, sum = 0;
		var	att = "", dmg = "";

		filtered.forEach(f => {
		//	collect the base save from each class
			srcs = f.system.savingThrows;
			ifort += srcs.fort.base;
			iref += srcs.ref.base;
			iwill += srcs.will.base;
			//  for some reason, Mythic Tier was tied to a class instead of being handled like a prestige
			//	class on its own. Pick it up while tallying classes.
			mythicTier += f.system.mythicTier;
		});
		srcs = await this.actor.system.attributes.savingThrows;
        await this.setCalculated("Total Fortitude Save", srcs.fort.total);
        await this.setCalculated("Base Save Fortitude", ifort);
        await this.setCalculated("Con Modifier S", this.actor.system.abilities.con.mod);
        await this.setCalculated("Total Reflex Save", srcs.ref.total);
        await this.setCalculated("Base Save Reflex", iref);
        await this.setCalculated("Dex Modifier S", this.actor.system.abilities.dex.mod);
        await this.setCalculated("Total Will save", srcs.will.total);
        await this.setCalculated("Base Save Will", iwill);
        await this.setCalculated("Wis Modifier S", this.actor.system.abilities.wis.mod);
//        await this.setCalculated("Magic Modifier Fortitude", filtered[1].system.savingThrows.fort.value || "");
//        await this.setCalculated("Magic Modifier Reflex", filtered[1].system.savingThrows.ref.value || "");
//        await this.setCalculated("Magic Modifier Will", filtered[1].system.savingThrows.will.value || "");
        await this.setCalculated("Saving Throw Modifiers", this.actor.system.attributes.saveNotes);
//	END SAVING THROWS

//	START CONDITIONAL MODIFIERS
		filtered = this.actor.system.traits;
	//	A. DAMAGE REDUCTION; <.system.traits.dr>
		rslt = "";
		srcs = filtered.dr;
		temp = srcs.value.map(l => `${l.types.toString()}/${l.amount}`.capitalize()).sort().join(", ")
		rslt = (srcs.custom !== "") ? `${srcs.custom.capitalize()}, ${temp}` : temp;
        await this.setCalculated("Damage Reduction", rslt || "-");
		await this.setCalculated("Conditional Modifiers Line 1", `DR: [${rslt || "-"}]`);

	//	B. ENERGY RESISTANCE; <.system.traits.eres>
		rslt = "";
		srcs = filtered.eres;
		temp = srcs.value.map(l => `${l.types.toString()}/${l.amount}`.capitalize()).sort().join(", ");
		rslt = (srcs.custom !== "") ? `${srcs.custom.capitalize()}, ${temp}` : temp;
        await this.setCalculated("Energy Resistance", rslt || "-");
		temp = this.fieldMappings[0].filter(f => f.pdf == "Conditional Modifiers Line 1")[0].calculated;
		await this.setCalculated("Conditional Modifiers Line 1", `${temp} ER: [${rslt || "-"}]`);

	//	C. DAMAGE IMMUNITY; <.system.traits.di>
		rslt = filtered.di.base.map(l => l.capitalize()).sort().join(", ") || "";
        await this.setCalculated("Damage Immunity", rslt || "-");
		temp = this.fieldMappings[0].filter(f => f.pdf == "Conditional Modifiers Line 1")[0].calculated;
		await this.setCalculated("Conditional Modifiers Line 1", `${temp} Dmg Imm: [${rslt || "-"}]`);
	
	//	D. DAMAGE VULNERABILITY; <.system.traits.dv>
		rslt = filtered.dv.base.map(l => l.capitalize()).sort().join(", ") || "";
        await this.setCalculated("Damage Vulnerability", rslt || "-");
		temp = this.fieldMappings[0].filter(f => f.pdf == "Conditional Modifiers Line 1")[0].calculated;
		await this.setCalculated("Conditional Modifiers Line 1", `${temp} Vul: [${rslt || "-"}]`);
	
	//	E. CONDITION IMMUNITY; <.system.traits.ci>
		rslt = filtered.ci.base.map(l => l.capitalize()).sort().join(", ") || "";
        await this.setCalculated("Condition Immunity", rslt || "-");
		temp = this.fieldMappings[0].filter(f => f.pdf == "Conditional Modifiers Line 1")[0].calculated;
		await this.setCalculated("Conditional Modifiers Line 1", `${temp} Cnd Imm: [${rslt || "-"}]`);
		
        //this.setCalculated("Conditional Modifiers Line 1", [this.actor.system.traits.weaponProf.total.filter(String).map(l => l.capitalize()).join(", "), this.actor.system.traits.weaponProf.custom, this.actor.system.traits.armorProf.total.filter(String).map(l => l.capitalize()).join(", "), this.actor.system.traits.armorProf.custom,].filter(String).join(", "));
//  END CONDITIONAL MODIFIERS
	
//	BEGIN COMBAT STATS
	//	Initialtive
        await this.setCalculated("Total Initiative Modifier", this.actor.system.attributes.init.total);
        await this.setCalculated("Dex Modifier ini", this.actor.system.abilities.dex.mod);
        await this.setCalculated("Initiative Misc Modifier", this.actor.system.attributes.init.bonus);
	//	AC
        await this.setCalculated("Total Armor Class", this.actor.system.attributes.ac.normal.total);
        await this.setCalculated("Armor Bonus", this.actor.system.ac.normal.total);
        await this.setCalculated("Shield Bonus", this.actor.system.ac.shield.total);
        await this.setCalculated("Dex Modifier1", this.actor.system.abilities.dex.mod);
        await this.setCalculated("Size Modifier1", (this.actor.system.traits.size.value - 4));
        await this.setCalculated("Natural Armor", this.actor.system.attributes.naturalAC);
        await this.setCalculated("AC Misc Modifier", Math.floor(this.actor.system.attributes.ac.normal.total - this.actor.system.ac.normal.total - this.actor.system.ac.shield.total - this.actor.system.abilities.dex.mod - this.actor.system.attributes.naturalAC - 10));
        await this.setCalculated("Touch Armor Class", this.actor.system.attributes.ac.touch.total);
	//	Combat Maneuvers
		//	CMB
        await this.setCalculated("Total CMB", this.actor.system.attributes.cmb.total);
        await this.setCalculated("Str Modifiercmb", this.actor.system.abilities.str.mod);
        await this.setCalculated("Size Modifiercmb", (4 - await this.actor.system.traits.size.value));
		//	CMD
        await this.setCalculated("Total CMD", this.actor.system.attributes.cmd.total);
        await this.setCalculated("Str Modifiercmd", this.actor.system.abilities.str.mod);
        await this.setCalculated("Dex Modifiercmd", this.actor.system.abilities.dex.mod);
        await this.setCalculated("Size Modifiercmd", (4 - await this.actor.system.traits.size.value));
		//	BAB
		rslt = this.actor.system.attributes.bab.total;
        await this.setCalculated("Base Attack Bonus_a", rslt);
        await this.setCalculated("Base Attack Bonus1", rslt);
        await this.setCalculated("Base Attack Bonus2", rslt);
	//	Spell Resistance
        await this.setCalculated("Spell Resistance", this.actor.system.attributes.sr.total);
//	END COMBAT STATS

//	BEGIN MOVEMENT
		srcs = this.actor.system.attributes.speed;
        await this.setCalculated("Base Speed", srcs.land.base || "");
        await this.setCalculated("With Armor", srcs.land.total || "");
		await this.setCalculated("Fly", srcs.fly.base || "");
		rslt = (srcs.fly.base == null) || (srcs.fly.base == 0);
		//	don't show maneuverability without a Fly speed
        await this.setCalculated("Maneuverability", (rslt) ? "" : srcs.fly.maneuverability);
        await this.setCalculated("Swim", srcs.swim.base || "");
        await this.setCalculated("Climb", srcs.climb.base || "");
        await this.setCalculated("Burrow", srcs.burrow.base || "");
//	END MOVEMENT

//	BEGIN WEAPONS & ARMOUR
	//	weapons
        filtered = await this.actor._itemTypes.weapon.filter(i => i.system.equipped && i.hasAttack && i.hasDamage);
	//	natural attacks
		filtered = await filtered.concat(this.actor._itemTypes.attack.filter(j => j.isActive && j.hasAttack && j.hasDamage));

		var temp = "";
		for (var i = 0; i < filtered.length; i++) {

	//	Weapon Name Slots 1-5
			await this.setCalculated(`Weapon Name Slot ${i + 1}`, filtered[i]?.name || "");
			console.log(filtered[i]?.name);

	//	Weapon Type Slots 1-5
			rslt = "";
			srcs = filtered[i]?.system.weaponSubtype;
			rslt = (typeof srcs == "undefined") ? "" : (srcs.length > 2) ? srcs.capitalize().substring(0,1) : srcs;
			await this.setCalculated(`Type Slot ${i + 1}`, rslt || "");

	//	Attack Slots 1-5 (notice that "slot" is lower case in PDF)
			sum = 0;
			filtered[i].attackSources.forEach(a => { 
				sum += Number.isInteger(a.value) ? Number(a.value) : 0;
			});
			rslt = (sum >= 15) ? `+${sum}/${sum - 5}/${sum - 10}` : (sum >= 10) ? `+${sum}/${sum - 5}` : `+${sum}`;
			await this.setCalculated(`Attack Bonus slot ${i + 1}`, rslt || "");

	//	Critical Range Slots 1-5
			await this.setCalculated(`Critical Slot ${i + 1}`, filtered[i]?.actions.contents[0]?.ability.critRange || "");

	//	Critical Mult Slots 1-5
			rslt = "";
			if (filtered[i]?.actions.contents[0]?.damage.critParts.length !== 0) {
			//	this section handles the Critical Multiple for the Wounds & Vigor optional settings as
			//	the critical rolls are handled manually and the mult is set to "2"
				filtered[i]?.actions.contents[0]?.damage.critParts.forEach(c => {
					if (c.types.filter(t => t == "wounds").size > 0) {
						rslt = c.formula.replace("[Crit]","");
					}
				});
			} else {
			//	default pf1e system
				rslt = filtered[i]?.actions.contents[0]?.ability.critMult;
			}
			await this.setCalculated(`Multi Slot ${i + 1}`, rslt || "");

	//	Range Slots 1 - 5 (notice that "slot" is lower case in PDF)
			rslt = "";
			rslt = (typeof filtered[i]?.actions.contents[0]?.range.value == "undefined") ? "" : (filtered[i]?.actions.contents[0]?.range.value == 0) ? "" : filtered[i]?.actions.contents[0]?.range.value + " " + filtered[i]?.actions.contents[0]?.range.units;
			await this.setCalculated(`Range slot ${i + 1}`, rslt || "");
			
	//	Damage Slots 1 - 5
			var skip = false;
			rslt = "";
			sum = 0;
			if (typeof filtered[i]?.actions.contents[0]["ckl-roll-bonuses"].formula !== "undefined") {
			//	Use the damage formula from module Roll Bonuses PF1 as it has all the damage listed
				rslt = filtered[i]?.actions.contents[0]["ckl-roll-bonuses"].formula;
				skip = true;
			}
			if (rslt == "") {
			//	Use the more difficult method and piece together the result
				//	grab any existing formula
				rslt = filtered[i]?.actions.contents[0]?.damage.nonCritParts[0]?.formula || filtered[i]?.actions.contents[0]?.damage.parts[0]?.formula;
				//	(typeof filtered[i]?.actions.contents[0]?.damage.parts[0]?.formula == "undefined") ? filtered[i]?.actions.contents[0]?.damage.nonCritParts[0]?.formula : filtered[i]?.actions.contents[0]?.damage.parts[0]?.formula;
				//	grab the 'enh' bonus => picked up by [.allDamageSources]
			//	sum = (filtered[i].system.enh !== "") ? filtered[i].system.enh : 0;
			}
			//	get bonus damage associated stat, if any
			dmgStat = filtered[i]?.actions.contents[0]?.damage.parts[0].parent.ability.damage;				
			srcs = await this.actor.system.abilities;
			//	get bonus damage from associated stat
			dmgMod = (dmgStat !== "") ? ((dmgStat == "str") ? srcs.str.mod : (dmgStat == "dex") ? srcs.dex.mod : (dmgStat == "int") ? srcs.int.mod : (dmgStat == "wis") ? srcs.wis.mod : srcs.cha.mod) : 0;
			//	used '2h'? +50% more damage
			dmgMod = (filtered[i].system.held == "2h") ? Math.floor(dmgMod * 1.5) : dmgMod;
			if (filtered[i].allDamageSources.length !== 0 && (!skip)) { 
			//	Only picking up "enh" value?
				filtered[i].allDamageSources.forEach(d => {
				//	not always a "value", check for formula
					if (typeof d.formula !== "undefined") {
						if ((d.formula.includes("+")) || (d.formula.includes("/"))) {
							//  grab the highest level as the @cl
							var cl = (this.fieldMappings[0].filter(f => f.pdf == "Level1")[0].calculated !== "") ? Math.max(this.fieldMappings[0].filter(f => f.pdf == "Level")[0].calculated, this.fieldMappings[0].filter(f => f.pdf == "Level1")[0].calculated) : this.fieldMappings[0].filter(f => f.pdf == "Level")[0].calculated;
							temp = d.formula.toLowerCase().replace(/\@cl[a-z.]*/, `${cl}`).replace("floor", "Math.floor").replace("max", "Math.max").replace("min", "Math.min").replace("ceil", "Math.ceil");						
							sum = eval(temp);
						} else {
							sum += Number(d.value);
						}
					}
				});
			}
			rslt = (rslt.includes("@abilities")) ? rslt.replace(`@abilities.${dmgStat}.mod`, dmgMod) : rslt;
			rslt = (rslt.includes("[Roll]")) ? rslt.replace("[Roll]", "") : rslt;
			//	not the correct implementation of pf1e enricher @sizeRoll(a, b, @size, n)
			if (rslt.includes("sizeRoll")) {
				//  rslt.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), \u0040size, ?(?<num>[0-9]*)\)/, `$<count>d$<size>`) : rslt;
				rslt = await pf1.utils.formula.simplify(rslt, filtered[i].getRollData());
				console.log(rslt);
			}	
			if (!rslt.includes("+") && (!skip)) {
				rslt += "+" + (sum + dmgMod);
			}
			await this.setCalculated(`Damage Slot ${i + 1}`, rslt || "");
		
	//	Damage Type Slots [DT Slot 1-5]
			rslt = "";
			srcs = filtered[i]?.actions.contents[0]?.damage.parts[0]?.types || filtered[i]?.actions.contents[0]?.damage.nonCritParts[0]?.types;
			srcs.forEach(t => {
				rslt += t.toUpperCase().substring(0,1);
			});
			await this.setCalculated(`DT Slot ${i + 1}`, rslt || "");

	//	Ammunition Slots 1 - 5
			rslt = "";
			await this.setCalculated(`Ammunition Slot ${i + 1}`, filtered[i]?.actions.contents[0]?.ammo.type || "");
		}

	//	Armour and Shields
		//	Armour
		filtered = await this.actor.itemTypes.equipment.filter(i => i.subType === "armor" && i.system.equipped);
		// .map(i => i.name).sort().join(",\n");
		if (filtered.length > 0) {
			await this.setCalculated("AC Items Slot 1", filtered[0].name);
			await this.setCalculated("Bonus 1", filtered[0].system.armor.total);
			rslt = filtered[0].system.equipmentSubtype.replace("Armor", "").capitalize();
			await this.setCalculated("Type 1", rslt);
			await this.setCalculated("Check Penalty 1", filtered[0].system.armor.acp);
			await this.setCalculated("Spell Failure 1", filtered[0].system.spellFailure);
			await this.setCalculated("Weight 1", filtered[0].system.weight.total);
			//	pick up any enhancement
			rslt = (filtered[0].system.armor.enh) ? `+${filtered[0].system.armor.enh}` : "";
			//	pick up any supplemental abilities
			temp = filtered[0].system.links.supplements.map(s => s.name).sort().join(", ");
			rslt = (rslt !== "") ? (`${rslt}, ${temp}`) : temp;
			//	if the dictionary item "properties" exists, add that
			temp = filtered[0].system.flags.dictionary.properties || "";
			rslt = (rslt !== "") ? (`${rslt}, ${temp}`) : temp;
			await this.setCalculated("Properties 1", rslt || "");
		}
		//	Shield
		filtered = await this.actor.itemTypes.equipment.filter(i => i.subType === "shield" && i.system.equipped);
		// .map(i => i.name).sort().join(",\n");
		if (filtered.length > 0) {
			await this.setCalculated("AC Items Slot 2", filtered[0].name);
			await this.setCalculated("Bonus 2", filtered[0].system.armor.total);
			rslt = filtered[0].system.equipmentSubtype.replace("Shield", "").capitalize();
			await this.setCalculated("Type 2", rslt);
			await this.setCalculated("Check Penalty 2", filtered[0].system.armor.acp);
			await this.setCalculated("Spell Failure 2", filtered[0].system.spellFailure);
			await this.setCalculated("Weight 2", filtered[0].system.weight.total);
			//	pick up any enhancement
			rslt = (filtered[0].system.armor.enh) ? `+${filtered[0].system.armor.enh}` : "";
			//	pick up any supplemental abilities
			temp = filtered[0].system.links.supplements.map(s => s.name).sort().join(", ");
			rslt = (rslt !== "") ? (`${rslt}, ${temp}`) : temp;
			//	if the dictionary item "properties" exists, add that
			temp = filtered[0].system.flags.dictionary.properties || "";
			rslt = (rslt !== "") ? (`${rslt}, ${temp}`) : temp;
			await this.setCalculated("Properties 2", rslt || "");
		}
	//	missing lines 3, 4 and 5 --- extra lines for spares perhaps?
	
//		END WEAPONS & ARMOUR

        await this.setCalculated("Item 1", this.actor.items.filter(i => ["loot", "weapon", "container", "consumable", "equipment"].includes(i.type)).map(i => `${i.name} (${i.system.quantity})`).sort().join(",\n"));
        await this.setCalculated("Spell Name Level 0", this.actor._itemTypes.spell.filter(i => ["spell"].includes(i.type) && i.system.level === 0).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 1", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 1).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 2", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 2).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 3", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 3).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 4", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 4).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 5", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 5).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 6", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 6).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 7", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 7).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 8", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 8).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Spell Name Level 9", this.actor.items.filter(i => ["spell"].includes(i.type) && i.system.level === 9).map(i => `this.actor.{i.name}`).sort().join(" // "));
        await this.setCalculated("Copper", this.actor.system.currency.cp || "");
        await this.setCalculated("Silver", this.actor.system.currency.sp || "");
        await this.setCalculated("Gold", this.actor.system.currency.gp || "");
        await this.setCalculated("Platinum", this.actor.system.currency.pp || "");
        await this.setCalculated("Total WT", this.actor.system.attributes.encumbrance.carriedWeight);
        await this.setCalculated("Light Load", this.actor.system.attributes.encumbrance.levels.light);
        await this.setCalculated("Medium Load", this.actor.system.attributes.encumbrance.levels.medium);
        await this.setCalculated("Heavy Load", this.actor.system.attributes.encumbrance.levels.heavy);
        await this.setCalculated("Lift Over Head", this.actor.system.attributes.encumbrance.levels.heavy);
        await this.setCalculated("Lift Off Ground", this.actor.system.attributes.encumbrance.levels.carry);
        await this.setCalculated("Drag or Push", this.actor.system.attributes.encumbrance.levels.drag);
        await this.setCalculated("Feat 1", this.actor.items.filter(i => i.type === "feat" && i.subType === "feat").map(i => i.name).sort().join("\n"));
        await this.setCalculated("Special Abilities 1", this.actor.items.filter(i => i.type === "feat" && i.subType === "classFeat").map(i => i.name).sort().join("\n"));
        await this.setCalculated("Special Abilities 2", this.actor.items.filter(i => i.type === "feat" && i.subType === "trait").map(i => i.name).sort().join("\n"));
        await this.setCalculated("First Class Experience Points", this.actor.system.details.xp.value);
        await this.setCalculated("First Class Next Level", this.actor.system.details.xp.max);
        await this.setCalculated("First Class Experience Points1", this.actor.system.details.xp.pct);
        /*
        await this.setCalculated("Spells Per Day Level 0", this.actor.data.spells.primary.spells.spell0.value);
        await this.setCalculated("Spells Per Day Level 1", this.actor.data.spells.primary.spells.spell1.value);
        await this.setCalculated("Spells Per Day Level 2", this.actor.data.spells.primary.spells.spell2.value);
        await this.setCalculated("Spells Per Day Level 3", this.actor.data.spells.primary.spells.spell3.value);
        await this.setCalculated("Spells Per Day Level 4", this.actor.data.spells.primary.spells.spell4.value);
        await this.setCalculated("Spells Per Day Level 5", this.actor.data.spells.primary.spells.spell5.value);
        await this.setCalculated("Spells Per Day Level 6", this.actor.data.spells.primary.spells.spell6.value);
        await this.setCalculated("Spells Per Day Level 7", this.actor.data.spells.primary.spells.spell7.value);
        await this.setCalculated("Spells Per Day Level 8", this.actor.data.spells.primary.spells.spell8.value);
        await this.setCalculated("Spells Per Day Level 9", this.actor.data.spells.primary.spells.spell9.value);
        await this.setCalculated("Close", this.actor.data.spells.primary.range.close);
        await this.setCalculated("Medium", this.actor.data.spells.primary.range.medium);
        await this.setCalculated("Long", this.actor.data.spells.primary.range.long);
        */
        await this.setCalculated("Acrobatics", this.actor.system.skills.acr.cs);
        await this.setCalculated("Appraise Check", this.actor.system.skills.apr.cs);
        await this.setCalculated("Bluff Check", this.actor.system.skills.blf.cs);
        await this.setCalculated("Climb check", this.actor.system.skills.clm.cs);
        await this.setCalculated("Diplomacy Check", this.actor.system.skills.dip.cs);
        await this.setCalculated("Disable Device Check", this.actor.system.skills.dev.cs);
        await this.setCalculated("Disguise Check", this.actor.system.skills.dis.cs);
        await this.setCalculated("Escape Artist Check", this.actor.system.skills.esc.cs);
        await this.setCalculated("Fly Check", this.actor.system.skills.fly.cs);
        await this.setCalculated("Handle Animal Check", this.actor.system.skills.han.cs);
        await this.setCalculated("Heal Check", this.actor.system.skills.hea.cs);
        await this.setCalculated("Intimidate Check", this.actor.system.skills.int.cs);
        await this.setCalculated("Linguistics Check", this.actor.system.skills.lin.cs);
        await this.setCalculated("Perception Check", this.actor.system.skills.per.cs);
        await this.setCalculated("Ride Check", this.actor.system.skills.rid.cs);
        await this.setCalculated("Sense Motive Check", this.actor.system.skills.sen.cs);
        await this.setCalculated("Sleight Of Hand Check", this.actor.system.skills.slt.cs);
        await this.setCalculated("SpellCraft Check", this.actor.system.skills.spl.cs);
        await this.setCalculated("Stealth Check", this.actor.system.skills.ste.cs);
        await this.setCalculated("Survival", this.actor.system.skills.sur.cs);
        await this.setCalculated("Swim Check", this.actor.system.skills.swm.cs);
        await this.setCalculated("Use Magic Device Check", this.actor.system.skills.umd.cs);
        await this.setCalculated("Ranks 1", this.actor.system.skills.acr.rank);
        await this.setCalculated("Ranks 2", this.actor.system.skills.apr.rank);
        await this.setCalculated("Ranks 3", this.actor.system.skills.blf.rank);
        await this.setCalculated("Ranks 4", this.actor.system.skills.clm.rank);
        await this.setCalculated("Ranks 8", this.actor.system.skills.dip.rank);
        await this.setCalculated("Ranks 9", this.actor.system.skills.dev.rank);
        await this.setCalculated("Ranks 10", this.actor.system.skills.dis.rank);
        await this.setCalculated("Ranks 11", this.actor.system.skills.esc.rank);
        await this.setCalculated("Ranks 12", this.actor.system.skills.fly.rank);
        await this.setCalculated("Ranks 13", this.actor.system.skills.han.rank);
        await this.setCalculated("Ranks 14", this.actor.system.skills.hea.rank);
        await this.setCalculated("Ranks 15", this.actor.system.skills.int.rank);
        await this.setCalculated("Ranks 16", this.actor.system.skills.kar.rank);
        await this.setCalculated("Ranks 17", this.actor.system.skills.kdu.rank);
        await this.setCalculated("Ranks 18", this.actor.system.skills.ken.rank);
        await this.setCalculated("Ranks 19", this.actor.system.skills.kge.rank);
        await this.setCalculated("Ranks 20", this.actor.system.skills.khi.rank);
        await this.setCalculated("Ranks 21", this.actor.system.skills.klo.rank);
        await this.setCalculated("Ranks 22", this.actor.system.skills.kna.rank);
        await this.setCalculated("Ranks 23", this.actor.system.skills.kno.rank);
        await this.setCalculated("Ranks 24", this.actor.system.skills.kpl.rank);
        await this.setCalculated("Ranks 25", this.actor.system.skills.kre.rank);
        await this.setCalculated("Ranks 26", this.actor.system.skills.lin.rank);
        await this.setCalculated("Ranks 27", this.actor.system.skills.per.rank);
        await this.setCalculated("Ranks 32", this.actor.system.skills.rid.rank);
        await this.setCalculated("Ranks 33", this.actor.system.skills.sen.rank);
        await this.setCalculated("Ranks 34", this.actor.system.skills.slt.rank);
        await this.setCalculated("Ranks 35", this.actor.system.skills.spl.rank);
        await this.setCalculated("Ranks 36", this.actor.system.skills.ste.rank);
        await this.setCalculated("Ranks 37", this.actor.system.skills.sur.rank);
        await this.setCalculated("Ranks 38", this.actor.system.skills.swm.rank);
        await this.setCalculated("Ranks 39", this.actor.system.skills.umd.rank);
        await this.setCalculated("Total Bonus 1", this.actor.system.skills.acr.mod);
        await this.setCalculated("Total Bonus 2", this.actor.system.skills.apr.mod);
        await this.setCalculated("Total Bonus 3", this.actor.system.skills.blf.mod);
        await this.setCalculated("Total Bonus 4", this.actor.system.skills.clm.mod);
        await this.setCalculated("Total Bonus 8", this.actor.system.skills.dip.mod);
        await this.setCalculated("Total Bonus 9", this.actor.system.skills.dev.mod);
        await this.setCalculated("Total Bonus 10", this.actor.system.skills.dis.mod);
        await this.setCalculated("Total Bonus 11", this.actor.system.skills.esc.mod);
        await this.setCalculated("Total Bonus 12", this.actor.system.skills.fly.mod);
        await this.setCalculated("Total Bonus 13", this.actor.system.skills.han.mod);
        await this.setCalculated("Total Bonus 14", this.actor.system.skills.hea.mod);
        await this.setCalculated("Total Bonus 15", this.actor.system.skills.int.mod);
        await this.setCalculated("Total Bonus 16", this.actor.system.skills.kar.mod);
        await this.setCalculated("Total Bonus 17", this.actor.system.skills.kdu.mod);
        await this.setCalculated("Total Bonus 18", this.actor.system.skills.ken.mod);
        await this.setCalculated("Total Bonus 19", this.actor.system.skills.kge.mod);
        await this.setCalculated("Total Bonus 20", this.actor.system.skills.khi.mod);
        await this.setCalculated("Total Bonus 21", this.actor.system.skills.klo.mod);
        await this.setCalculated("Total Bonus 22", this.actor.system.skills.kna.mod);
        await this.setCalculated("Total Bonus 23", this.actor.system.skills.kno.mod);
        await this.setCalculated("Total Bonus 24", this.actor.system.skills.kpl.mod);
        await this.setCalculated("Total Bonus 25", this.actor.system.skills.kre.mod);
        await this.setCalculated("Total Bonus 26", this.actor.system.skills.lin.mod);
        await this.setCalculated("Total Bonus 27", this.actor.system.skills.per.mod);
        await this.setCalculated("Total Bonus 32", this.actor.system.skills.rid.mod);
        await this.setCalculated("Total Bonus 33", this.actor.system.skills.sen.mod);
        await this.setCalculated("Total Bonus 34", this.actor.system.skills.slt.mod);
        await this.setCalculated("Total Bonus 35", this.actor.system.skills.spl.mod);
        await this.setCalculated("Total Bonus 36", this.actor.system.skills.ste.mod);
        await this.setCalculated("Total Bonus 37", this.actor.system.skills.sur.mod);
        await this.setCalculated("Total Bonus 38", this.actor.system.skills.swm.mod);
        await this.setCalculated("Total Bonus 39", this.actor.system.skills.umd.mod);
        await this.setCalculated("Profession 1 Check", this.actor.system.skills.pro.subSkills.pro1?.cs);
        await this.setCalculated("Profession 1", this.actor.system.skills.pro.subSkills.pro1?.name || "");
        await this.setCalculated("Total Bonus 30", (this.actor.system.skills.pro.subSkills.pro1?.name) ? this.actor.system.skills.pro.subSkills.pro1.mod : "");
        await this.setCalculated("Ranks 30", (this.actor.system.skills.pro.subSkills.pro1?.name) ? this.actor.system.skills.pro.subSkills.pro1.rank : "");
        await this.setCalculated("Profession 2 Check", this.actor.system.skills.pro.subSkills.pro2?.cs || "");
        await this.setCalculated("Profession 2", this.actor.system.skills.pro.subSkills.pro2?.name || "");
        await this.setCalculated("Total Bonus 31", (this.actor.system.skills.pro.subSkills.pro2?.name) ? this.actor.system.skills.pro.subSkills.pro2.mod : "");
        await this.setCalculated("Ranks 31", (this.actor.system.skills.prf.subSkills.pro2?.name) ? this.actor.system.skills.prf.subSkills.pro2.rank : "");
        await this.setCalculated("Perform 1 check", this.actor.system.skills.prf.subSkills.prf1?.cs);
        await this.setCalculated("Perform 1", this.actor.system.skills.prf.subSkills.prf1?.name || "");
        await this.setCalculated("Total Bonus 28", (this.actor.system.skills.prf.subSkills.prf1?.name) ? this.actor.system.skills.prf.subSkills.prf1.mod : "");
        await this.setCalculated("Ranks 28", (this.actor.system.skills.prf.subSkills.prf1?.name) ? this.actor.system.skills.prf.subSkills.prf1.rank : "");
        await this.setCalculated("Perform 2 check", this.actor.system.skills.prf.subSkills.prf2?.cs || "");
        await this.setCalculated("Perform 2", this.actor.system.skills.prf.subSkills.prf2?.name || "");
        await this.setCalculated("Total Bonus 29", (this.actor.system.skills.prf.subSkills.prf2?.name) ? this.actor.system.skills.prf.subSkills.prf2.mod : "");
        await this.setCalculated("Ranks 29", (this.actor.system.skills.prf.subSkills.prf2?.name) ? this.actor.system.skills.prf.subSkills.prf2.rank : "");
        await this.setCalculated("Craft Check 1", this.actor.system.skills.crf.subSkills.crf1?.cs || "");
        await this.setCalculated("Craft 1", this.actor.system.skills.crf.subSkills.crf1?.name || "");
        await this.setCalculated("Total Bonus 5", (this.actor.system.skills.crf.subSkills.crf1?.name) ? this.actor.system.skills.crf.subSkills.crf1.mod : "");
        await this.setCalculated("Ranks 5", (this.actor.system.skills.crf.subSkills.crf1?.name) ? this.actor.system.skills.crf.subSkills.crf1.rank : "");
        await this.setCalculated("Craft Check 2", this.actor.system.skills.crf.subSkills.crf2?.cs || "");
        await this.setCalculated("Craft 2", this.actor.system.skills.crf.subSkills.crf2?.name || "");
        await this.setCalculated("Total Bonus 6", (this.actor.system.skills.crf.subSkills.crf2?.name) ? this.actor.system.skills.crf.subSkills.crf2.mod : "");
        await this.setCalculated("Ranks 6", (this.actor.system.skills.crf.subSkills.crf2?.name) ? this.actor.system.skills.crf.subSkills.crf2.rank : "");
        await this.setCalculated("Craft Check 3", this.actor.system.skills.crf.subSkills.crf3?.cs || "");
        await this.setCalculated("Craft 3", this.actor.system.skills.crf.subSkills.crf3?.name || "");
        await this.setCalculated("Total Bonus 7", (this.actor.system.skills.crf.subSkills.crf3?.name) ? this.actor.system.skills.crf.subSkills.crf3.mod : "");
        await this.setCalculated("Ranks 7", (this.actor.system.skills.crf.subSkills.crf3?.name) ? this.actor.system.skills.crf.subSkills.crf3.rank : "");
//	BEGIN LANGUAGES
		rslt = await this.actor.system.traits.languages.base.map(l => l.capitalize()).sort().toString().replaceAll(',', ', ').replace('Ancientosiriani', 'Ancient Osiriani').replace('Drowsign', 'Drow Sign').replace('Shadowtongue', 'Shadow Tongue');
		await this.setCalculated("Languages Line 1", rslt);
		//[.value.filter(String).map(l => l.capitalize()).sort().join(", "), this.actor.system.traits.languages.custom,].filter(String).join(", "));
//	END LANGUAGES
		/*
        await this.setCalculated("Damage Slot 1", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[0]?.data?.data?.damage?.parts[0][0]?.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), ?\u0040size\)/, "$<count>d$<size>") || "");
        await this.setCalculated("DT Slot 1", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[0]?.data?.data?.damage?.parts[0][1] || "");
        await this.setCalculated("Damage Slot 2", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[1]?.data?.data?.damage?.parts[0][0]?.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), ?\u0040size\)/, "$<count>d$<size>") || "");
        await this.setCalculated("DT Slot 2", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[1]?.data?.data?.damage?.parts[0][1] || "");
        await this.setCalculated("Damage Slot 3", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[2]?.data?.data?.damage?.parts[0][0]?.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), ?\u0040size\)/, "$<count>d$<size>") || "");
        await this.setCalculated("DT Slot 3", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[2]?.data?.data?.damage?.parts[0][1] || "");
        await this.setCalculated("Damage Slot 4", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[3]?.data?.data?.damage?.parts[0][0]?.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), ?\u0040size\)/, "$<count>d$<size>") || "");
        await this.setCalculated("DT Slot 4", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[3]?.data?.data?.damage?.parts[0][1] || "");
        await this.setCalculated("Damage Slot 5", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[4]?.data?.data?.damage?.parts[0][0]?.replace(/sizeRoll\((?<count>[0-9]*), ?(?<size>[0-9]*), ?\u0040size\)/, "$<count>d$<size>") || "");
        await this.setCalculated("DT Slot 5", this.actor.items.filter(i => i.type === "weapon" && i.system.equipped && i.hasAttack && i.hasDamage)[4]?.data?.data?.damage?.parts[0][1] || "");
*/
    }

}

export default MappingClass;
