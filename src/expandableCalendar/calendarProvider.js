import _ from 'lodash';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {Animated, TouchableOpacity} from 'react-native';
import XDate from 'xdate';

import styleConstructor from './style';
import CalendarContext from './calendarContext';


const commons = require('./commons');
const UPDATE_SOURCES = commons.UPDATE_SOURCES;

class CalendarProvider extends Component {
  static propTypes = {
    // Initial date in 'yyyy-MM-dd' format. Default = Date()
    date: PropTypes.any.isRequired,
    // callback for date change event
    onDateChanged: PropTypes.func,
    // whether to show the today button
    showTodayButton: PropTypes.bool
  }

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);

    this.state = {
      date: this.props.date || XDate().toString('yyyy-MM-dd'),
      updateSource: UPDATE_SOURCES.CALENDAR_INIT,
      buttonY: new Animated.Value(-65),
      buttonIcon: this.getButtonIcon(props.date),
      disabled: false,
      opacity: new Animated.Value(1)
    };
  }
  
  getProviderContextValue = () => {
    return {
      setDate: this.setDate,
      date: this.state.date,
      updateSource: this.state.updateSource,
      setDisabled: this.setDisabled
    };
  };

  setDate = (date, updateSource) => {
    this.setState({date, updateSource}, () => {
      this.animateTodayButton(date);
    });
    _.invoke(this.props, 'onDateChanged', date, updateSource);
  }

  setDisabled = (disabled) => {
    if (this.props.showTodayButton && disabled !== this.state.disabled) {
      this.setState({disabled});
      this.animateOpacity(disabled);
    }
  }

  getButtonIcon(date) {
    const isPastDate = this.isPastDate(date);
    return isPastDate ? require('../img/down.png') : require('../img/up.png');
  }

  isPastDate(date) {
    const today = XDate();
    const d = XDate(date);

    if (today.getFullYear() > d.getFullYear()) {
      return true;
    }
    if (today.getFullYear() === d.getFullYear()) {
      if (today.getMonth() > d.getMonth()) {
        return true;
      }
      if (today.getMonth() === d.getMonth()) {
        if (today.getDate() > d.getDate()) {
          return true;
        }
      }
    }
    return false;
  }

  animateTodayButton(date) {
    if (this.props.showTodayButton) {
      this.setState({buttonIcon: this.getButtonIcon(date)});
  
      const today = XDate().toString('yyyy-MM-dd');
      const isToday = today === date;
      
      Animated.spring(this.state.buttonY, {
        toValue: isToday ? 65 : -65,
        tension: 30,
        friction: 8,
        useNativeDriver: true
      }).start();
    }
  }

  animateOpacity(disabled) {
    Animated.timing(this.state.opacity, {
      toValue: disabled ? 0.6 : 1, 
      duration: 500
    }).start();
  }

  onTodayPress = () => {
    const today = XDate().toString('yyyy-MM-dd');
    this.setDate(today, UPDATE_SOURCES.TODAY_PRESS);
  }

  renderTodayButton() {
    const {disabled, opacity} = this.state;
    const todayString = XDate.locales[XDate.defaultLocale].today || commons.todayString;
    const today = todayString.charAt(0).toUpperCase() + todayString.slice(1);
    
    return (
      <Animated.View style={[this.style.todayButtonContainer, {transform: [{translateY: this.state.buttonY}]}]}>
        <TouchableOpacity style={this.style.todayButton} onPress={this.onTodayPress} disabled={disabled}>
          <Animated.Image style={[this.style.todayButtonImage, {opacity}]} source={this.state.buttonIcon}/>
          <Animated.Text style={[this.style.todayButtonText, {opacity}]}>{today}</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  render() {
    return (
      <CalendarContext.Provider value={this.getProviderContextValue()}>
        {this.props.children}
        {this.props.showTodayButton && this.renderTodayButton()}
      </CalendarContext.Provider>
    );
  }
}

export default CalendarProvider;
