// @flow

import React, { createRef, useState, Component } from 'react'
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import SimpleLeaflet from "./SimpleLeaflet"
import FindByPointResults from "./FindByPointResults"
import SearchInputWidget from "./SearchInputWidget"
import SearchResultWidget from './SearchResultWidget';
import MainPageResultComponent from './MainPageResultComponent';

export default class FindByPointComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      latlng: null,
      locations: {},
      num_locations: 0,
      searchMode: false,
      findByPointMode: false,
      searchQuery: "",
      curr_location_uri: null
    }
    this.updateResult = this.updateResult.bind(this);

    this.testFn = (latlng) => {
      console.log("TestFN here! " + latlng);
      this.updateResult(latlng)
    };
  }
  renderlatlng(latlng) {
    return latlng.lat + ", " + latlng.lng;
  }

  updateResult(latlng) {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.setState({
      latlng: latlng
    });
    console.log("State updated!")
    console.log(this.state)
    this.findByLatLng();

  }
  arrayAwareInvert(obj) {
    var res = {};
    for (var p in obj) {
      var arr = obj[p], l = arr.length;
      for (var i = 0; i < l; i++) {
        res[arr[i]] = p;
      }
    }
    return res;
  }

  formatResults(r) {
    console.log(r);

    const listLocations = this.arrayAwareInvert(r.locations);
    console.log(listLocations);

    this.setState({
      num_locations: r.meta.count,
      locations: r.locations
    })
    return r;
  }

  findByLatLng() {
    //https://api2.loci.cat/api/v1/location/find_at_location?loci_type=any&lat=-29.901619&lon=141.391879&count=1000&offset=0
    console.log("find_at_location");

    var url = new URL(process.env.REACT_APP_LOCI_INTEGRATION_API_ENDPOINT
      + "/location/find_at_location"),
      params = {
        loci_type: "any",
        lat: this.state.latlng.lat,
        lon: this.state.latlng.lng,
        count: 1000,
        offset: 0
      }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    console.log(url);
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            queryResults: this.formatResults(result)
          });
          console.log(result);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            error
          });
        }
      )
  }
  
  performSearch = (searchQuery) => {
    //this.setState({message: childData})
    this.setState({
      resultsMode: "SEARCH",
      searchQuery: searchQuery
    });
  }


  performFindAtPoint = (d) => {
    this.setState({
      resultsMode: "FIND_AT_POINT",
    });
  }

 
  renderResultSummaryFn = (uri) => {
    //this.setState({message: childData})
    this.setState({
      resultsMode: "RESULT_SUMMARY",
      curr_location_uri: uri
    });
  }

  render() {
    var ll = null;
    var numLoc = 0;
    var locations = {};

    if (this.state.latlng) {
      ll = this.state.latlng.lat.toString() + ", " + this.state.latlng.lng.toString();
      locations = this.state.locations;
      numLoc = this.state.num_locations;
    }

    var searchOrFindByPointResultComponent;
    if (this.state.resultsMode == "SEARCH") {
      searchOrFindByPointResultComponent = (<SearchResultWidget renderResultSummaryFn={this.renderResultSummaryFn} query={this.state.searchQuery} />) 
    } 
    else if (this.state.resultsMode == "FIND_AT_POINT") {
      searchOrFindByPointResultComponent = (<FindByPointResults latlng={ll} locations={locations} count={numLoc} />)
    }
    else if (this.state.resultsMode == "RESULT_SUMMARY") {
      searchOrFindByPointResultComponent = (<MainPageResultComponent location_uri={this.state.curr_location_uri}/>)
    }

    else { //assume RESULT_SUMMARY mode
      searchOrFindByPointResultComponent = (<div></div>)
    }

    return (
      <Container fluid='true'>
        <Row>
          <Col sm={6}>
            <SimpleLeaflet inputRef={this.testFn} pointSelectCallback={this.performFindAtPoint}/>
          </Col>
          <Col sm={6}>
            <Row>
              <Col sm={12}>
                <SearchInputWidget placeholderMsg='Search by location label (e.g. NSW) or click on the map to find locations' 
                        parentCallback={this.callbackFunction} searchCallback={this.performSearch} />                        
              </Col>
            </Row>
            <Row>
              <Col sm={12}>
                 {searchOrFindByPointResultComponent}
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    )
  }
}